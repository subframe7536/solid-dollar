import type { Setter, Signal, createResource, createSignal } from 'solid-js'

import type { SetStoreFunction } from 'solid-js/store/types/store'

export type SignalParam<T> = Parameters<typeof createSignal<T>>

export type SignalObject<T> = {
  (): T
  (setter: Parameters<Setter<T>>[0]): T
  readonly source: Signal<T>
}

export type ResourceReturn<T, R = unknown> = ReturnType<typeof createResource<T, R>>
export type ResourceParam<T, R = unknown> = Parameters<typeof createResource<T, R>>

export type ResourceObject<T, R> = ResourceReturn<T, R>[0] & {
  mutate: ResourceReturn<T, R>[1]['mutate']
  refetch: ResourceReturn<T, R>[1]['refetch']
}

export type BaseStore<T, R> = R & {
  store: T
  $patch: (cb: (state: T) => void) => void
  $reset: () => void
}

export type StoreOption<T extends object, R extends ActionReturn> = {
  state: T | (() => T)
  action: ActionFunctions<T, R>
  persist?: PersistOption<T>
}

export type ActionFunctions<T, R> = (set: SetStoreFunction<T>) => R
export type ActionReturn = Record<string, (...args: any[]) => void>

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
