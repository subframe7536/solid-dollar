import { createEffect, createRoot, createSignal, on } from 'solid-js'
import { testEffect } from '@solidjs/testing-library'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { $, $resource, $signal, $store, isSignalObject } from '../src'

describe('createSignal($)', () => {
  test('$()', () => {
    const foo = $()
    expect(foo()).toBe(undefined)
    expect(isSignalObject(foo)).toBe(true)
    const bar = $signal(1)
    expect(bar()).toBe(1)
    expect(bar(2)).toBe(2)
    expect(bar()).toBe(2)
    expectTypeOf(bar.source).toBeArray()
    expectTypeOf(bar.source[0]).toBeFunction()
    expectTypeOf(bar.source[1]).toBeFunction()
  })
  test('$(createSignal())', () => {
    const x = $signal(createSignal(2))
    expect(x()).toBe(2)
    expect(x(4)).toBe(4)
    expectTypeOf(x.source).toBeArray()
    expectTypeOf(x.source[0]).toBeFunction()
    expectTypeOf(x.source[1]).toBeFunction()
  })
})

describe('createResource($res)', () => {
  test('$res()', () => {
    testEffect((done) => {
      const t = $(1)
      const fetchUser = async (id: number) => ++id
      const foo = $resource(t, fetchUser, { name: 'test' })
      createEffect(on(foo, () => {
        expect(foo()).toBe(2)
        done()
      }, { defer: true }))
    })
  })
})

describe('createStore($store)', () => {
  test('$store()', () => {
    createRoot(() => {
      const [, useTestStore] = $store('test', {
        state: { test: 1 },
        action: set => ({
          double() {
            set('test', test => test * 2)
          },
        }),
      })
      const { store, double } = useTestStore()
      expect(store.test).toBe(1)
      double()
      expect(store.test).toBe(2)
    })
  })
})
