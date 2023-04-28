import { deepTrack } from '@solid-primitives/deep'
import type { FlowComponent, JSX, ParentComponent } from 'solid-js'
import { createComponent, createContext, createEffect, on, useContext } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import type { ActionReturn, BaseStore, NormalizedPersistOption, PersistOption, StoreOption } from './type'

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
  R extends ActionReturn = {},
>(
  name: string,
  options: StoreOption<T, R>,
): [provider: ParentComponent, useStore: () => BaseStore<T, R>] {
  const { action, state, persist: persistOption } = options
  const initalState = typeof state === 'function' ? state() : state
  const [store, setStore] = createStore<T>(initalState, { name })
  const option = normalizePersistOption(name, persistOption)
  if (option) {
    const { debug, key, serializer: { deserialize, serialize }, storage } = option
    const stored = storage.getItem(key)
    createEffect(on(() => deepTrack(store), () => {
      debug && console.log(store)
      storage.setItem(key, serialize(store))
    }, { defer: true }))
    try {
      stored && setStore(deserialize(stored))
    } catch (e) {
      debug && console.log(e)
    }
  }
  const $patch = (cb: (state: T) => void) => setStore(produce(store => cb(store)))
  const $reset = () => setStore(initalState)

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
