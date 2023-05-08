import { deepTrack } from '@solid-primitives/deep'
import type { FlowComponent, JSX, ParentComponent, ParentProps } from 'solid-js'
import { batch, createComponent, createContext, createEffect, createMemo, observable, on, onMount, untrack, useContext } from 'solid-js'

import { createStore, reconcile, unwrap } from 'solid-js/store'
import type { SetStoreFunction, Store } from 'solid-js/store/types/store'

export type BaseStore<T, S, R> = R & S & {
  store: T
}
export type UseStoreReturn<T, S, R> = BaseStore<T, S, R> & {
  $patch: (state: T) => void
  $reset: () => void
  $subscribe: ReturnType<typeof observable<T>>['subscribe']
}

export type StoreSetup<
  Store extends object,
  Getter extends GetterReturn,
  Action extends ActionReturn,
> = {
  state: Store | (() => Store)
  getter?: GetterFunctions<Store, Getter>
  action?: ActionFunctions<Store, Action>
  persist?: PersistOption<Store>
}

export type ActionFunctions<T, R> = (set: SetStoreFunction<T>) => R
export type ActionReturn = Record<string, (...args: any[]) => void>
export type GetterFunctions<T, R> = (state: Store<T>) => R
export type GetterReturn = ActionReturn

export type PersistOption<T extends object> =
  Partial<NormalizedPersistOption<T>> & {
    enable: boolean
  }
export type NormalizedPersistOption<T extends object> = {
  storage: StorageLike
  key: string
  serializer: Serializer<T>
  debug: boolean
}
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
  return (!option || !option.enable)
    ? undefined
    : {
        debug: option?.debug ?? false,
        key: option?.key ?? name,
        serializer: {
          serialize: option?.serializer?.serialize ?? JSON.stringify,
          deserialize: option?.serializer?.deserialize ?? JSON.parse,
        },
        storage: option?.storage ?? localStorage,
      }
}

function parseFunctions<T extends object>(functions: T, parseFn: (fn: () => any) => any) {
  const actions: Record<string, () => any> = {}
  for (const [name, fn] of Object.entries(functions)) {
    actions[name] = parseFn(fn)
  }
  return actions
}

function parseGetter<T extends object>(functions: T) {
  return parseFunctions(functions, fn => createMemo(() => fn()))
}

function parseAction<T extends object>(functions: T) {
  return parseFunctions(functions, (fn: (...args: any) => any) => {
    return (...args: any) => batch(() => untrack(() => fn(...args)))
  })
}
export function $store<
  T extends object = {},
  Getter extends GetterReturn = {},
  Action extends ActionReturn = {},
>(
  name: string,
  setup: StoreSetup<T, Getter, Action>,
): readonly [provider: ParentComponent, useStore: () => UseStoreReturn<T, Getter, Action>] {
  const { action = () => ({}), getter = () => ({}), state, persist } = setup
  const initalState = typeof state === 'function' ? state() : state
  const [store, setStore] = createStore<T>(initalState, { name })
  const ctxData = {
    store,
    ...parseGetter(getter(store)),
    ...parseAction(action(setStore)),
    $patch: (state: T) => setStore(reconcile(state, { key: name, merge: true })),
    $reset: () => setStore(initalState),
    $subscribe: observable(() => deepTrack(store)).subscribe,
  } as UseStoreReturn<T, Getter, Action>

  const setupContext = () => {
    const option = normalizePersistOption(name, persist)
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
  const ctx = createContext<UseStoreReturn<T, Getter, Action>>(ctxData, { name: `ctx_${name}` })

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
