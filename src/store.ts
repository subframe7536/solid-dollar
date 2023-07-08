import { trackStore } from '@solid-primitives/deep'
import { pathGet, pathSet } from 'object-standard-path'
import type { Path, PathValue } from 'object-standard-path'
import type { Context, JSX, ParentComponent, ParentProps } from 'solid-js'
import { batch, createComponent, createContext, createEffect, createMemo, getOwner, on, onMount, runWithOwner, untrack, useContext } from 'solid-js'
import { createStore, reconcile, unwrap } from 'solid-js/store'
import type { SetStoreFunction, Store } from 'solid-js/store/types/store'

export type BaseStore<T, S, R> = R & S & {
  store: T
}
export type UseStoreReturn<T, S, R> = BaseStore<T, S, R> & {
  $patch: (state: Partial<T>) => void
  $reset: () => void
  $subscribe: (callback: (state: T) => void) => void
}

export type StoreSetup<
  Store extends object,
  Getter extends GetterReturn,
  Action extends ActionReturn,
  Paths extends Path<Store>[],
> = {
  state: Store | (() => Store)
  getter?: GetterFunctions<Store, Getter>
  action?: ActionFunctions<Store, Action>
  persist?: PersistOption<Store, Paths>
}

export type ActionFunctions<T, R> = (set: SetStoreFunction<T>) => R
export type ActionReturn = Record<string, (...args: any[]) => void>
export type GetterFunctions<T, R> = (state: Store<T>) => R
export type GetterReturn = ActionReturn

export type PersistOption<T extends object, Paths extends Path<T>[]> = Partial<NormalizedPersistOption<T, Paths>> & {
  enable: boolean
}
export type NormalizedPersistOption<T extends object, K extends Path<T>[] = []> = {
  storage: StorageLike
  key: string
  serializer: Serializer<FlattenType<PartialObject<T, K>>>
  debug: boolean
  paths: K | undefined
}
type PartialObject<
  T extends object,
  K extends Path<T>[],
  V = {},
> = K['length'] extends 0
  ? T
  : K['length'] extends 1
    ? { [P in Extract<K[0], string>]: PathValue<T, P> }
    : K extends [infer A, ...infer B]
      ? B extends any[]
        ? V & {
          [P in Extract<A, string>]: PathValue<T, Extract<A, string>>;
        } & PartialObject<T, B, V>
        : V & { [P in Extract<A, string>]: PathValue<T, Extract<A, string>> }
      : never

type FlattenType<T> = T extends infer U ? ConvertType<{ [K in keyof U]: U[K] }> : never
type ConvertType<T> = {
  [K in keyof T as K extends `${infer A}.${string}` ? A : K]: K extends `${string}.${infer B}` ? ConvertType<{ [P in B]: T[K] }> : T[K];
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

export function normalizePersistOption<T extends object, Paths extends Path<T>[]>(
  name: string,
  option: PersistOption<T, Paths> | undefined,
): NormalizedPersistOption<T, Paths> | undefined {
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
        paths: option.paths,
      }
}

function parseFunctions<T extends object>(functions: T, parseFn: (fn: () => any) => any) {
  const actions: Record<string, any> = {}
  for (const [name, fn] of Object.entries(functions)) {
    actions[name] = parseFn(fn)
  }
  return actions
}

function parseGetter<T extends object>(functions: T) {
  return parseFunctions(functions, fn => createMemo(() => fn()))
}

function parseAction<T extends object>(functions: T) {
  return parseFunctions(functions, (fn: (...args: any) => any) =>
    (...args: any) => batch(() => untrack(() => fn(...args))),
  )
}

/**
 * Creates a deep clone of the given target object or array.
 * @param target The target object or array to clone.
 * @returns The deep clone of the target.
 */
export function deepClone<T>(target: T): T {
  const newTarget = (Array.isArray(target) ? [] : {}) as T
  for (const key in target) {
    if (typeof target[key] === 'object' && target[key]) {
      newTarget[key] = deepClone(target[key])
    } else {
      newTarget[key] = target[key]
    }
  }
  return newTarget
}

export type StoreObject<T> = Store<T> & {
  set: SetStoreFunction<T>
}

export function $store<T extends object = {}>(initialValue?: T): StoreObject<T> {
  const [store, setStore] = createStore(initialValue)
  const ret = store as StoreObject<T>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  ret.set = setStore
  return ret
}

/**
 * create global state
 * @param name store name
 * @param setup store setup object
 */
export function $state<
  T extends object = {},
  Getter extends GetterReturn = {},
  Action extends ActionReturn = {},
  Paths extends Path<T>[] = [],
  Is extends boolean | undefined = undefined,
>(
  name: string,
  setup: StoreSetup<T, Getter, Action, Paths>,
  provider?: Is,
): Is extends false | undefined
    ? () => UseStoreReturn<T, Getter, Action>
    : readonly [provider: ParentComponent, useStore: () => UseStoreReturn<T, Getter, Action> | undefined] {
  const { action = () => ({}), getter = () => ({}), state, persist } = setup
  const initalState = typeof state === 'function' ? state() : state
  const [store, setStore] = createStore<T>(deepClone(initalState), { name })

  const ctxData = {
    store,
    ...parseGetter(getter(store)),
    ...parseAction(action(setStore)),
    $patch: (state: Partial<T>) => setStore(reconcile(Object.assign({}, unwrap(store), state), { key: name, merge: true })),
    $reset: () => setStore(initalState),
    $subscribe: (callback: (state: T) => void) => runWithOwner(getOwner(), () => {
      createEffect(on(() => trackStore(store), (state) => {
        callback(state)
      }, { defer: true }))
    }),
  } as UseStoreReturn<T, Getter, Action>

  const stateFn = () => {
    const option = normalizePersistOption(name, persist)
    if (option) {
      const { debug, key, serializer: { deserialize, serialize }, storage, paths } = option
      function persistItems() {
        if (!paths) {
          storage.setItem(key, serialize(store as any))
          return
        }
        const obj = {}
        paths.forEach((path) => {
          pathSet(obj, path as any, pathGet(store, path))
        })
        storage.setItem(key, serialize(obj as any))
      }
      onMount(() => {
        const stored = storage.getItem(key)
        try {
          if (stored) {
            ctxData.$patch(deserialize(stored))
            debug && console.log(`[$store - ${key}]: read from persisted, value: ${stored}`)
          } else {
            persistItems()
            debug && console.log(`[$store - ${key}]: no persisted data, initialize`)
          }
        } catch (e) {
          debug && console.error(`[$store - ${key}]: ${e}`)
        }
      })
      createEffect(on(() => trackStore(store), (state) => {
        debug && console.log(`[$store - ${key}]: update to ${JSON.stringify(state)}`)
        persistItems()
      }, { defer: true }))
    }
    return ctxData
  }

  const ctx = provider ? createContext() : createContext(stateFn())
  return (provider
    ? [
        (props: ParentProps): JSX.Element =>
          createComponent(ctx.Provider, {
            value: stateFn(),
            get children() {
              return props.children
            },
          }),
        () => useContext(ctx as Context<unknown>),
      ] as const
    : () => useContext(ctx as Context<UseStoreReturn<T, Getter, Action>>)) as any
}
