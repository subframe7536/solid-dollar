import { describe, test } from 'vitest'
import { $fs } from '../src/fs'
import './fs.mock'

describe('test $fs', () => {
  test('test init', async () => {
    console.log(await $fs(['ts']))
  })
})
