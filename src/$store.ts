import type { FlowComponent, JSX, ParentComponent } from 'solid-js'
import { createComponent, createContext, createEffect, on, onMount, useContext } from 'solid-js'

import { createStore, produce } from 'solid-js/store'
import type { BaseStore, NormalizedPersistOption, PersistOption, StoreOption } from './type'

function normalizePersistOption<T extends object>(
  name: string,
  option: PersistOption<T> | undefined,
): NormalizedPersistOption<T> | undefined {
  if (!option || (typeof option === 'object' && !option.enable)) {
    return undefined
  }
  if (typeof option === 'boolean') {
    return {
      debug: true,
      key: name,
      serializer: {
        serialize: JSON.stringify,
        deserialize: JSON.parse,
      },
      storage: localStorage,
    }
  }
  return {
    debug: option.debug ?? false,
    key: option.key ?? name,
    serializer: {
      serialize: option.serializer?.serialize || JSON.stringify,
      deserialize: option.serializer?.deserialize ?? JSON.parse,
    },
    storage: option.storage ?? localStorage,
  }
}

export function $store<
  T extends object = {},
  R extends Record<string, (...args: any[]) => void> = {},
>(
  options: StoreOption<T, R>,
): [provider: ParentComponent, useStore: () => BaseStore<T, R>] {
  const { action, name, state, persist: persistOption } = options
  const [store, setStore] = createStore<T>(state, { name })
  const option = normalizePersistOption(name, persistOption)
  onMount(() => {
    if (!option) {
      return
    }
    const { debug, key, serializer: { deserialize, serialize }, storage } = option
    const stored = storage.getItem(key)
    try {
      stored && setStore(deserialize(stored))
      createEffect(on(() => state, () => {
        storage.setItem(key, serialize(state))
      }))
    } catch (e) {
      debug && console.log(e)
    }
  })
  const $patch = (cb: (state: T) => void) => {
    setStore(produce(store => cb(store)))
  }
  const $reset = () => {
    setStore(state)
  }

  const ctxData = { store, ...action(setStore), $patch, $reset }
  const ctx = createContext(ctxData, { name: `ctx_${name}` })
  return [
    (props) => {
      return createComponent(ctx.Provider, {
        value: ctxData,
        get children() {
          return props.children
        },
      })
    },
    () => useContext(ctx),
  ]
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
