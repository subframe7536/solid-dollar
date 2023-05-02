import { $ } from './signal'

interface WebFsHandleNode {
  handle: FileSystemHandle
  path: string[]
  children?: WebFsHandleNode[]
}
export type WebFile = {
  /**
   * relative dir path of root exclude `.`, sep: `/`
  */
  dir: string
  name: string
  /**
   * with dot
   */
  ext: string
  /**
   * set to 0 when fail to get file
   */
  size: number
  addTime?: Date
  /**
   * set to current date when fail to get file
   */
  modifiedTime: Date
}
function parseFilename(filename: string) {
  const match = /.(\.[^./]+)$/.exec(filename)
  const ext = match ? match[1] : ''
  const base = ext ? filename.slice(0, -ext.length) : filename
  return { base, ext }
}
async function parseFile(dir: string[], handle: FileSystemFileHandle, addTime?: boolean): Promise<WebFile> {
  const name = dir[dir.length - 1]
  dir.pop()

  let lastModified
  let size = 0
  try {
    const fileInfo = await handle.getFile()
    lastModified = fileInfo.lastModified
    size = fileInfo.size
  } catch (error) { }

  const { base, ext } = parseFilename(name)
  const ret: WebFile = {
    dir: dir.join('/'),
    modifiedTime: lastModified ? new Date(lastModified) : new Date(),
    name: base,
    ext,
    size,
  }
  if (addTime) {
    ret.addTime = new Date()
  }
  return ret
}

async function buildWebFsHandleNodeTree(
  handle: FileSystemHandle,
  extensions?: (string | RegExp)[],
): Promise<WebFsHandleNode> {
  async function build(handle: FileSystemHandle, path: string[]): Promise<WebFsHandleNode> {
    const node: WebFsHandleNode = {
      handle,
      path: [...path, handle.name],
    }

    if (handle.kind === 'directory') {
      const entries = (handle as FileSystemDirectoryHandle).entries()
      node.children = []
      for await (const entry of entries) {
        const isValidFile = extensions
          ? extensions.some(ext => entry[0].endsWith(`.${ext}`))
          : true
        isValidFile && node.children.push(await build(entry[1], node.path))
      }
    }

    return node
  }
  return build(handle, [])
}

async function walkTree(
  root: FileSystemHandle | WebFsHandleNode,
  extensions?: (string | RegExp)[],
  addTime?: boolean,
): Promise<WebFile[]> {
  async function walk(node: WebFsHandleNode): Promise<WebFile[]> {
    if (node.handle.kind === 'file') {
      const fileHandle = node.handle as FileSystemFileHandle
      const webFile = await parseFile(node.path, fileHandle, addTime)
      return [webFile]
    }

    if (!node.children) {
      return []
    }
    const childrenFiles = await Promise.all(
      node.children.map(childNode => walk(childNode)),
    )
    return childrenFiles.flat()
  }
  return walk('path' in root ? root : await buildWebFsHandleNodeTree(root, extensions))
}
class UnSupportedError extends Error { }
export function isSupportFs() {
  return typeof globalThis.showDirectoryPicker === 'function'
}
/**
 * @param extensions file extension(without dot)
 * @throws {@link UnSupportedError}
 */
export async function $fs(
  extensions?: (string | RegExp)[],
  addTime?: boolean,
) {
  if (!isSupportFs) {
    throw new UnSupportedError()
  }
  let dir = await globalThis.showDirectoryPicker()
  const nodeTree = $(await buildWebFsHandleNodeTree(dir, extensions ?? []))
  let fileArray = await walkTree(nodeTree(), extensions, addTime)
  const buildTree = async () => {
    dir = await global.showDirectoryPicker()
    nodeTree(await buildWebFsHandleNodeTree(dir, extensions ?? []))
  }

  return {
    root: dir,
    tree: nodeTree,
    buildTree,
  }
}
