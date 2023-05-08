import { describe, test } from 'vitest'
import { $fs } from '../src/fs'
import './fs.mock'

describe('test $fs', () => {
  test('test init', async () => {
    const { fileArray, nodeTree, handleMap, root, fetchTree } = $fs(['ts'])
    await fetchTree()
    console.log(nodeTree)
    for await (const entry of root()!.entries()) {
      console.log(entry[0], entry[1].kind)
    }
    console.log(JSON.stringify(fileArray()), JSON.stringify(handleMap))
  })
})
