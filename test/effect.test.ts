import { describe, expect, test, vi } from 'vitest'
import { $, $effect } from '../src'

describe('$effect', () => {
  test('basic', async () => {
    const value = $(0)
    const callback = vi.fn()

    $effect(value, callback, { defer: true })

    await Promise.resolve()
    value.set(1)
    await Promise.resolve()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(1, undefined, undefined)

    value.set(2)
    await Promise.resolve()
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith(2, 1, undefined)
  })

  test('filter', async () => {
    const str = $('old')
    const callback = vi.fn()
    const filter = (newValue: string, times: number) => {
      return newValue !== 'new'
    }

    $effect(str, callback, { filterFn: filter, defer: true })

    await Promise.resolve()
    str.set('new')
    await Promise.resolve()
    expect(callback).toHaveBeenCalledTimes(0)

    str.set('new new')
    await Promise.resolve()
    expect(callback).toHaveBeenCalledTimes(1)

    // cannot filter old value
    expect(callback).toHaveBeenCalledWith('new new', 'new', undefined)
  })

  test('pause & resume', async () => {
    const value = $(0)
    const callback = vi.fn()

    const { pause, resume, isWatching } = $effect(value, callback, { defer: true })

    await Promise.resolve()
    value.set(100)
    await Promise.resolve()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(100, undefined, undefined)

    pause()
    expect(isWatching()).toBe(false)
    value.set(200)
    await Promise.resolve()
    expect(callback).toHaveBeenCalledTimes(1)

    resume()
    value.set(300)
    await Promise.resolve()
    expect(callback).toHaveBeenCalledTimes(2)

    // cannot filter old value
    expect(callback).toHaveBeenCalledWith(300, 200, undefined)
  })
})
