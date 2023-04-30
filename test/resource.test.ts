import { testEffect } from '@solidjs/testing-library'
import { createEffect, on } from 'solid-js'
import { describe, expect, test } from 'vitest'
import { $, $resource } from '../src'

describe('test resource', () => {
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
