import { createRoot } from 'solid-js'
import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'
import { $Providers, $store } from '../src'
import { normalizePersistOption } from '../src/store'

describe('test normalizePersistOption()', () => {
  test('returns undefined with undefined option', () => {
    expect(normalizePersistOption('testUndefined', undefined)).toBeUndefined()
  })
  test('returns normalized options with true option', () => {
    expect(normalizePersistOption('testTrue', true)).toEqual({
      debug: false,
      key: 'testTrue',
      serializer: {
        serialize: expect.any(Function),
        deserialize: expect.any(Function),
      },
      storage: localStorage,
    })
  })
  test('returns undefined with false option', () => {
    expect(normalizePersistOption('testFalse', false)).toBeUndefined()
  })
  test('returns normalized options with enable option set to true', () => {
    expect(normalizePersistOption('testEnable', { enable: true })).toEqual({
      debug: false,
      key: 'testEnable',
      serializer: {
        serialize: expect.any(Function),
        deserialize: expect.any(Function),
      },
      storage: localStorage,
    })
  })
  test('returns undefined with enable option set to false', () => {
    expect(normalizePersistOption('testDisable', { enable: false })).toBeUndefined()
  })
  test('returns normalized options with custom options', () => {
    const kv = new Map()
    const testObj = normalizePersistOption('testObj', {
      enable: true,
      debug: true,
      key: 'test',
      serializer: {
        deserialize(v) {
          return { test: v.substring(1, v.length - 2) }
        },
        serialize(v) {
          return `'${v}'`
        },
      },
      storage: {
        getItem(key) {
          return kv.get(key)
        },
        setItem(key, value) {
          kv.set(key, value)
        },
      },
    })
    expect(testObj).toEqual({
      debug: true,
      key: 'test',
      serializer: {
        serialize: expect.any(Function),
        deserialize: expect.any(Function),
      },
      storage: {
        getItem: expect.any(Function),
        setItem: expect.any(Function),
      },
    })
  })
  test('returns normalized options with custom options', () => {
    const testObj = normalizePersistOption('test', {
      enable: true,
      key: 'testObjMissing',
    })
    expect(testObj).toEqual({
      debug: false,
      key: 'testObjMissing',
      serializer: {
        serialize: expect.any(Function),
        deserialize: expect.any(Function),
      },
      storage: localStorage,
    })
  })
})
describe('test store', () => {
  test('$store()', () => {
    const kv = new Map()
    createRoot(() => {
      const [, useTestStore] = $store('test', {
        state: { test: 1 },
        action: set => ({
          double() {
            set('test', test => test * 2)
          },
        }),
        persist: {
          enable: true,
          storage: {
            getItem(key) {
              return kv.get(key)
            },
            setItem(key, value) {
              kv.set(key, value)
            },
          },
          debug: true,
        },
      })
      const { store, double } = useTestStore()
      expect(store.test).toBe(1)
      double()
      expect(store.test).toBe(2)
    })
  })
  test('should create a Solid store provider and hook', () => {
    const initialState = { count: 0 }
    const [Provider, useStore] = $store('test', {
      state: initialState,
      action: set => ({
        increment: () => set('count', n => n + 1),
        decrement: () => set('count', n => n - 1),
      }),
    })
    const { store, decrement, increment } = useStore()
    const { unmount, getByTestId } = render(() => (
      <$Providers values={[Provider]}>
        <div>
          <p data-testid="value">{store.count}</p>
          <button data-testid="increment" onClick={increment}>Increment</button>
          <button data-testid="decrement" onClick={decrement}>Decrement</button>
        </div>
      </$Providers>
    ))

    const p = getByTestId('value')
    const incrementBtn = getByTestId('increment')
    const decrementBtn = getByTestId('decrement')
    expect(p.innerText).toBe('0')
    fireEvent.click(incrementBtn)
    expect(p.innerText).toBe('1')
    fireEvent.click(decrementBtn)
    expect(p.innerText).toBe('0')
    unmount()
  })

  test('should persist state to storage', () => {
    const initialState = { count: 0 }
    const kv = new Map()
    const [Provider, useStore] = $store('test', {
      state: initialState,
      action: set => ({
        increment: () => set('count', n => n + 1),
        decrement: () => set('count', n => n - 1),
      }),
      persist: {
        enable: true,
        storage: {
          getItem(key) {
            return kv.get(key)
          },
          setItem(key, value) {
            kv.set(key, value)
          },
        },
        debug: true,
      },
    })
    const { store, decrement, increment } = useStore()
    const { unmount, getByTestId } = render(() => (
      <Provider>
        <div>
          <p data-testid="value">{store.count}</p>
          <button data-testid="increment" onClick={increment}>Increment</button>
          <button data-testid="decrement" onClick={decrement}>Decrement</button>
        </div>
      </Provider>
    ))

    const p = getByTestId('value')
    const incrementBtn = getByTestId('increment')
    const decrementBtn = getByTestId('decrement')
    expect(p.innerText).toBe('0')
    expect(kv.get('test')).toBe('{"count":0}')
    fireEvent.click(incrementBtn)
    expect(p.innerText).toBe('1')
    expect(kv.get('test')).toBe('{"count":1}')
    fireEvent.click(decrementBtn)
    expect(p.innerText).toBe('0')
    expect(kv.get('test')).toBe('{"count":0}')
    fireEvent.click(incrementBtn)
    fireEvent.click(incrementBtn)
    unmount()
    const { container: newContainer } = render(() => (
      <Provider>
        <p>{useStore().store.count}</p>
      </Provider>
    ))
    const newP = newContainer.querySelector('p')!
    expect(kv.get('test')).toBe('{"count":2}')
    expect(newP.innerText).toBe('2')
    cleanup()
  })
})