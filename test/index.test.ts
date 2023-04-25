import { createSignal } from 'solid-js'
import { } from '@solidjs/testing-library'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { $, $res, $store } from '../src'

describe('createSignal($)', () => {
  test('$()', () => {
    const foo = $()
    expect(foo()).toBe(undefined)
    const bar = $(1)
    expect(bar()).toBe(1)
    bar.set(2)
    expect(bar()).toBe(2)
    expectTypeOf(bar.signal).toBeArray()
    expectTypeOf(bar.signal[0]).toBeFunction()
    expectTypeOf(bar.signal[1]).toBeFunction()
  })
  test('$(createSignal())', () => {
    const x = $(createSignal(2))
    expect(x()).toBe(2)
    x.set(4)
    expect(x()).toBe(4)
    expectTypeOf(x.signal).toBeArray()
    expectTypeOf(x.signal[0]).toBeFunction()
    expectTypeOf(x.signal[1]).toBeFunction()
  })
})

describe('createResource($res)', () => {
  test('$res()', () => {
    const t = $(1)
    const fetchUser = async (id: number) => id++
    const foo = $res(t, fetchUser, { name: 'test' })
    expect(foo()).toBe(2)
  })
})

describe('createStore($store)', () => {
  test('$store()', () => {
    const t = $store({ test: 1 })
    expect(t()).toStrictEqual({ test: 1 })
    t.set({ test: 2 })
    expect(t().test).toBe(2)
  })
})
