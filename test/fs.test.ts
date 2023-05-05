import { describe, test } from 'vitest'
import { $fs } from '../src/fs'
import './fs.mock'

describe('test $fs', () => {
  test('test init', async () => {
    const { fileArray, handleMap, root } = await $fs(['ts'])
    await Promise.resolve()
    console.log(root(), JSON.stringify(fileArray), JSON.stringify(handleMap))
  })
})
