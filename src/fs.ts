/// <reference path="../node_modules/@types/wicg-file-system-access/index.d.ts" />

import { ReactiveMap } from '@solid-primitives/map'
import { batch } from 'solid-js'
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
  instance: File | undefined
}
function parseFilename(filename: string) {
  const match = /.(\.[^./]+)$/.exec(filename)
  const ext = match ? match[1] : ''
  const base = ext ? filename.slice(0, -ext.length) : filename
  return { base, ext }
}

function getDir(path: string) {
  const pathArray = path.split('/')
  const lastElement = pathArray.pop() ?? ''
  if (lastElement === '') {
    return pathArray.pop()
  }
  return pathArray.join('/')
}

async function parseFile(
  dir: string[],
  handle: FileSystemFileHandle,
  addTime?: boolean,
): Promise<WebFile> {
  const name = dir[dir.length - 1]
  dir.pop()

  let lastModified
  let size = 0
  let instance
  try {
    const fileInfo = await handle.getFile()
    lastModified = fileInfo.lastModified
    size = fileInfo.size
    instance = fileInfo
  } catch (error) {}

  const { base, ext } = parseFilename(name)
  const ret: WebFile = {
    dir: dir.join('/'),
    modifiedTime: lastModified ? new Date(lastModified) : new Date(),
    name: base,
    ext,
    size,
    instance,
  }
  if (addTime) {
    ret.addTime = new Date()
  }
  return ret
}
type FileExtensions = string[] | RegExp

async function buildWebFsHandleNodeTree(
  handle: FileSystemHandle,
  extensions?: string[] | RegExp,
): Promise<WebFsHandleNode> {
  function matchExtension(filename: string): boolean {
    if (!extensions) {
      return true
    }
    if (Array.isArray(extensions)) {
      return extensions.some(ext => filename.endsWith(`.${ext}`))
    }
    return extensions.test(filename)
  }
  async function build(
    handle: FileSystemHandle,
    path: string[],
  ): Promise<WebFsHandleNode> {
    const node: WebFsHandleNode = {
      handle,
      path: [...path, handle.name],
    }

    if (handle.kind === 'directory') {
      const entries = (handle as FileSystemDirectoryHandle).entries()
      node.children = []
      for await (const entry of entries) {
        matchExtension(entry[0]) && node.children.push(await build(entry[1], node.path))
      }
    }

    return node
  }
  return build(handle, [])
}

async function walkWebFsNodeTree(
  root: FileSystemHandle | WebFsHandleNode,
  handleMap: Map<string, FileSystemHandle>,
  extensions?: string[] | RegExp,
  addTime?: boolean,
) {
  async function walk(node: WebFsHandleNode): Promise<WebFile[]> {
    handleMap.set(node.path.join('/'), node.handle)
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
  const _root = 'path' in root ? root : await buildWebFsHandleNodeTree(root, extensions)
  return {
    nodeTree: _root,
    handleMap,
    fileArray: await walk(_root),
  }
}
class UnSupportedError extends Error {}
export function isSupportFs() {
  return typeof globalThis.showDirectoryPicker === 'function'
}

/**
 * @param extensions file extension(without dot)
 * @throws {@link UnSupportedError}
 */
export function $fs(extensions?: FileExtensions, addTime?: boolean) {
  if (!isSupportFs) {
    throw new UnSupportedError()
  }
  const _extensions = extensions
  const _addTime = addTime
  let _nodeTree: WebFsHandleNode | undefined
  const _root = $<FileSystemDirectoryHandle>()
  const _fileArray = $<WebFile[]>()
  const _handleMap = new ReactiveMap<string, FileSystemHandle>()

  async function reload(
    root?: FileSystemDirectoryHandle,
    extensions?: FileExtensions,
    addTime?: boolean,
  ) {
    if (root !== undefined || _root() === undefined) {
      _root(root ?? (await window.showDirectoryPicker()))
    }
    batch(async () => {
      const { nodeTree, fileArray } = await walkWebFsNodeTree(
        _root()!,
        _handleMap,
        extensions ?? _extensions,
        addTime ?? _addTime,
      )
      _nodeTree = nodeTree
      _fileArray(fileArray)
    })

    return _root()!
  }

  return {
    root: _root,
    fileArray: _fileArray,
    handleMap: _handleMap,
    reload,
  }
}
