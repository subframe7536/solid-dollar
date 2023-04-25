import { createStore } from 'solid-js/store'

interface StoreObject<T extends object = {}> {
  (): T
  set: ReturnType<typeof createStore<T>>[1]
}

export function $store<T extends object = {}>(
  ...args: Parameters<typeof createStore<T>>
): StoreObject<T> {
  const [state, setState] = createStore(...args)
  const obj = () => state
  obj.set = setState
  return obj as unknown as StoreObject<T>
}
