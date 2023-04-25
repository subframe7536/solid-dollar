import { createResource } from 'solid-js'

type ResourceReturn<T, R = unknown> = ReturnType<typeof createResource<T, R>>
type ResourceParam<T, R = unknown> = Parameters<typeof createResource<T, R>>

type ResourceObject<T, R> = ResourceReturn<T, R>[0] & {
  mutate: ResourceReturn<T, R>[1]['mutate']
  refetch: ResourceReturn<T, R>[1]['refetch']
}
export function $res<T, R = unknown>(...args: ResourceParam<T, R>): ResourceObject<T, R> {
  const [data, { mutate, refetch }] = createResource<T, R>(...args)
  const obj = data
  Object.defineProperty(obj, 'mutate', { value: mutate })
  Object.defineProperty(obj, 'refetch', { value: refetch })
  return obj as ResourceObject<T, R>
}
