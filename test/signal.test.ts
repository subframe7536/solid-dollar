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
    expect(bar(2)).toBe(2)
    expect(bar()).toBe(2)
    expectTypeOf(bar.signal).toBeArray()
    expectTypeOf(bar.signal[0]).toBeFunction()
    expectTypeOf(bar.signal[1]).toBeFunction()
  })
  test('$(createSignal(string))', () => {
    const x = $signal(createSignal('str'))
    expect(x()).toBe('str')
    expect(x('test modify')).toBe('test modify')
    expect(x()).toBe('test modify')
    expectTypeOf(x.signal).toBeArray()
    expectTypeOf(x.signal[0]).toBeFunction()
    expectTypeOf(x.signal[1]).toBeFunction()
  })
})
