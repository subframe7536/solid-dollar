import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'
import { $store, normalizePersistOption } from '../src/store'

describe('test normalizePersistOption()', () => {
  test('returns undefined with undefined option', () => {
    expect(normalizePersistOption('testUndefined', undefined)).toBeUndefined()
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
    const useTestStore = $store('test', {
      state: { test: 1, foo: 'bar' },
      getter: state => ({
        doubleValue() {
          return state.test * 2
        },
      }),
      action: set => ({
        double() {
          set('test', test => test * 2)
        },
        plus(num: number) {
          set('test', test => test + num)
        },
      }),
    })
    const callback = vi.fn()
    const { store, double, plus, doubleValue, $patch, $reset, $subscribe } = useTestStore()
    $subscribe(callback)
    expect(store.test).toBe(1)
    expect(doubleValue()).toBe(2)
    double()
    expect(store.test).toBe(2)
    expect(doubleValue()).toBe(4)
    plus(200)
    expect(store.test).toBe(202)
    expect(doubleValue()).toBe(404)
    $patch({ foo: 'baz' })
    expect(store.foo).toBe('baz')
    $reset()
    expect(store.test).toBe(1)
    expect(store.foo).toBe('bar')
    expect(doubleValue()).toBe(2)
    expect(callback).toHaveBeenCalledTimes(4)
  })
  // test('stores outside $Providers should not be affected', () => {
  //   const initialState = { count: 0 }
  //   const useStore = $store('test', {
  //     state: initialState,
  //     action: set => ({
  //       increment: () => set('count', n => n + 1),
  //       decrement: () => set('count', n => n - 1),
  //     }),
  //   })
  //   const { store, decrement, increment } = useStore()
  //   const { unmount, getByTestId } = render(() => (
  //     <div>
  //       <p data-testid="out">{store.count}</p>
  //       <$Providers>
  //         <p data-testid="value">{store.count}</p>
  //         <button data-testid="increment" onClick={increment}>Increment</button>
  //         <button data-testid="decrement" onClick={decrement}>Decrement</button>
  //       </$Providers>
  //     </div>
  //   ))

  //   const p = getByTestId('value')
  //   const out = getByTestId('out')
  //   const incrementBtn = getByTestId('increment')
  //   const decrementBtn = getByTestId('decrement')
  //   console.log(out.innerHTML)
  //   expect(p.innerText).toBe('0')
  //   fireEvent.click(incrementBtn)
  //   console.log(out.innerHTML)
  //   expect(p.innerText).toBe('1')
  //   fireEvent.click(decrementBtn)
  //   console.log(out.innerHTML)
  //   expect(p.innerText).toBe('0')
  //   unmount()
  // })
  test('should successfully use nest $store()', () => {
    const initialState = { count: 0 }
    const useStore = $store('test', {
      state: initialState,
      getter: store => ({
        fresh: () => {
          return store.count * 2 + 20
        },
      }),
      action: set => ({
        increment: () => set('count', n => n + 1),
        decrement: () => set('count', n => n - 1),
      }),
    })
    const { store, fresh, decrement, increment } = useStore()
    const useTempStore = $store('temp', {
      state: initialState,
      action: set => ({
        generate: () => {
          increment()
          set('count', fresh())
        },
      }),
    })
    const { store: tempStore, generate } = useTempStore()
    const { unmount, getByTestId } = render(() => (
      <div>
        <p data-testid="value">{store.count}</p>
        <button data-testid="increment" onClick={increment}>Increment</button>
        <button data-testid="decrement" onClick={decrement}>Decrement</button>
      </div>
    ))

    const p = getByTestId('value')
    const incrementBtn = getByTestId('increment')
    const decrementBtn = getByTestId('decrement')
    expect(p.innerText).toBe('0')
    fireEvent.click(incrementBtn)
    expect(p.innerText).toBe('1')
    fireEvent.click(decrementBtn)
    expect(p.innerText).toBe('0')
    generate()
    expect(tempStore.count).toBe(22)
    unmount()
  })

  test('should persist state to storage', () => {
    const initialState = { count: 0 }
    const kv = new Map()
    const useStore = $store('test', {
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
      <div>
        <p data-testid="value">{store.count}</p>
        <button data-testid="increment" onClick={increment}>Increment</button>
        <button data-testid="decrement" onClick={decrement}>Decrement</button>
      </div>
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
      <p>{useStore().store.count}</p>
    ))
    const newP = newContainer.querySelector('p')!
    expect(kv.get('test')).toBe('{"count":2}')
    expect(newP.innerText).toBe('2')
    cleanup()
  })
})
