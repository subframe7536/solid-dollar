type BaseStore<T, R> = R & {
  store: T
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
