import { deepTrack } from '@solid-primitives/deep'
import type { FlowComponent, JSX, ParentComponent } from 'solid-js'
import { createComponent, createContext, createEffect, on, onMount, useContext } from 'solid-js'

import { createStore, produce } from 'solid-js/store'
import type { ActionReturn, BaseStore, N, NormalizedPersistOption, PersistOption, StoreOption } from './type'

export function normalizePersistOption<T extends object>(
  name: string,
  option: PersistOption<T> | undefined,
): NormalizedPersistOption<T> | undefined {
  return (!option || (typeof option === 'object' && !option.enable))
    ? undefined
    : {
        debug: (option as N<T>)?.debug ?? false,
        key: (option as N<T>)?.key ?? name,
        serializer: {
          serialize: (option as N<T>)?.serializer?.serialize ?? JSON.stringify,
          deserialize: (option as N<T>)?.serializer?.deserialize ?? JSON.parse,
        },
        storage: (option as N<T>)?.storage ?? localStorage,
      }
}

export function $store<
  T extends object = {},
  R extends ActionReturn = {},
>(
  name: string,
  options: StoreOption<T, R>,
): readonly [provider: ParentComponent, useStore: () => BaseStore<T, R>] {
  const { action, state, persist: persistOption } = options
  const initalState = typeof state === 'function' ? state() : state
  const [store, setStore] = createStore<T>(initalState, { name })
  onMount(() => {
    const option = normalizePersistOption(name, persistOption)
    if (!option) {
      return
    }
    const { debug, key, serializer: { deserialize, serialize }, storage } = option
    const stored = storage.getItem(key)
    try {
      stored && setStore(deserialize(stored))
    } catch (e) {
      debug && console.log(e)
    }
    createEffect(on(() => deepTrack(store), () => {
      debug && console.log(store)
      storage.setItem(key, serialize(store))
    }))
  })
  const $patch = (cb: (state: T) => void) => setStore(produce(store => cb(store)))
  const $reset = () => setStore(initalState)

  const ctxData = { store, ...action(setStore), $patch, $reset }
  const ctx = createContext(ctxData, { name: `ctx_${name}` })
  return [
    props => createComponent(ctx.Provider, {
      value: ctxData,
      get children() {
        return props.children
      },
    }),
    () => useContext(ctx),
  ] as const
}
export function $provider(props: {
  providers: FlowComponent[]
  children: JSX.Element
}): JSX.Element {
  const { providers } = props
  const fn = (i: number): JSX.Element | null => {
    const item = providers[i]
    return item
      ? createComponent(item, { children: fn(i + 1) })
      : props.children
  }
  return fn(0)!
}
