import { createSignal } from 'solid-js'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { $, $signal, isSignalObject } from '../src'

describe('test signal', () => {
  test('$()', () => {
    const foo = $()
    expect(foo()).toBe(undefined)
    expect(isSignalObject(foo)).toBe(true)
  })
  test('$signal(number)', () => {
    const bar = $signal(1)
    expect(bar()).toBe(1)
    expect(bar(2)).toBe(undefined)
    expect(bar(2, true)).toBe(2)
    expect(bar()).toBe(2)
    expectTypeOf(bar.source).toBeArray()
    expectTypeOf(bar.source[0]).toBeFunction()
    expectTypeOf(bar.source[1]).toBeFunction()
  })
  test('$(createSignal(string))', () => {
    const x = $signal(createSignal('str'))
    expect(x()).toBe('str')
    expect(x('test modify', true)).toBe('test modify')
    expect(x()).toBe('test modify')
    expectTypeOf(x.source).toBeArray()
    expectTypeOf(x.source[0]).toBeFunction()
    expectTypeOf(x.source[1]).toBeFunction()
  })
})
