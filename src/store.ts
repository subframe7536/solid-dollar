import { deepTrack } from '@solid-primitives/deep'
import type { FlowComponent, JSX, ParentComponent, ParentProps } from 'solid-js'
import { createComponent, createContext, createEffect, observable, on, onMount, useContext } from 'solid-js'

import { createStore, reconcile, unwrap } from 'solid-js/store'
import type { SetStoreFunction, Store } from 'solid-js/store/types/store'

export type BaseStore<T, R> = R & {
  store: T
}
export type UseStoreReturn<T, R> = BaseStore<T, R> & {
  $patch: (state: T) => void
  $reset: () => void
  $subscribe: ReturnType<typeof observable<T>>['subscribe']
}

export type StoreOption<T extends object, R extends ActionReturn> = {
  state: T | (() => T)
  action: ActionFunctions<T, R>
  persist?: PersistOption<T>
}
export type ObjectStore<
  Store extends object,
  Getter extends GetterReturn,
  Action extends ActionReturn,
> = {
  state: Store | (() => Store)
  getter?: GetterFunctions<Store, Getter>
  action?: ActionFunctions<Store, Action>
  persist?: PersistOption<Store>
}

type ExtractState<T> = { [K in keyof T]: Exclude<T[K], Function> }
type ExtractAction<T> = { [K in keyof T]: T[K] extends Function ? T[K] : never }
type FunctionStore<T> = BaseStore<ExtractState<T>, ExtractAction<T>>
export function generateState<T extends object>(obj: T): FunctionStore<T> {
  const store = {} as ExtractState<T>
  const ret = {} as FunctionStore<T>
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'function') {
      ret[key as keyof T] = value
    } else {
      store[key as keyof T] = value
    }
  })
  ret.store = store
  return ret
}

export type ActionFunctions<T, R> = (set: SetStoreFunction<T>) => R
export type ActionReturn = Record<string, (...args: any[]) => void>
export type GetterFunctions<T, R> = (state: Store<T>) => R
export type GetterReturn = ActionReturn

export type PersistOption<T extends object> =
| boolean
| Partial<NormalizedPersistOption<T>> & {
  enable: boolean
}
export type NormalizedPersistOption<T extends object> = {
  storage: StorageLike
  key: string
  serializer: Serializer<T>
  debug: boolean
}
export type N<T extends object> = NormalizedPersistOption<T>
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>
interface Serializer<T> {
  /**
   * Serializes state into string before storing
   * @default JSON.stringify
   */
  serialize: (value: T) => string

  /**
   * Deserializes string into state before hydrating
   * @default JSON.parse
   */
  deserialize: (value: string) => T
}

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

export function getfunctionStoreCtxData<
  T extends object = {},
>(
  name: string,
  func: (set?: SetStoreFunction<ExtractState<T>>) => T,
) {
  const { store } = generateState(func())
  const [state, setState] = createStore(store, { name })
  return { ...func(setState), store: state }
}
export function $store<
  T extends object = {},
  R extends ActionReturn = {},
>(
  name: string,
  options: StoreOption<T, R>,
): readonly [provider: ParentComponent, useStore: () => UseStoreReturn<T, R>] {
  const { action, state, persist: persistOption } = options
  const initalState = typeof state === 'function' ? state() : state
  const [store, setStore] = createStore<T>(initalState, { name })
  const ctxData: UseStoreReturn<T, R> = {
    store,
    ...action(setStore),
    $patch: (state: T) => setStore(reconcile(state, { key: name, merge: true })),
    $reset: () => setStore(initalState),
    $subscribe: observable(() => deepTrack(store)).subscribe,
  }

  const setupContext = () => {
    const option = normalizePersistOption(name, persistOption)
    if (option) {
      const { debug, key, serializer: { deserialize, serialize }, storage } = option
      onMount(() => {
        const stored = storage.getItem(key)
        try {
          if (stored) {
            setStore(deserialize(stored))
            debug && console.log(`[$store - ${key}]: read from persisted, value: ${stored}`)
          } else {
            storage.setItem(option.key, serialize(store))
            debug && console.log(`[$store - ${key}]: no persisted data, initialize`)
          }
        } catch (e) {
          debug && console.error(`[$store - ${key}]: ${e}`)
        }
      })
      createEffect(on(() => deepTrack(store), () => {
        debug && console.log(`[$store - ${key}]: update to ${JSON.stringify(store)}`)
        storage.setItem(option.key, serialize(unwrap(store)))
      }, { defer: true }))
    }
    return ctxData
  }
  const ctx = createContext<UseStoreReturn<T, R>>(ctxData, { name: `ctx_${name}` })

  return [
    (props: ParentProps): JSX.Element =>
      createComponent(ctx.Provider, {
        value: setupContext(),
        get children() {
          return props.children
        },
      }),
    () => useContext(ctx),
  ] as const
}
export function $Providers(props: {
  values: readonly FlowComponent[]
  children: JSX.Element
}): JSX.Element {
  const { values } = props
  const fn = (i: number): JSX.Element => {
    const item = values[i]

    if (!item) {
      return props.children
    }

    const ctxProps: { value?: any; children: JSX.Element } = {
      get children() {
        return fn(i + 1)
      },
    }
    return createComponent(item, ctxProps)
  }
  return fn(0)!
}
