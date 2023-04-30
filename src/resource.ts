import { createResource } from 'solid-js'

export type ResourceReturn<T, R = unknown> = ReturnType<typeof createResource<T, R>>
export type ResourceParam<T, R = unknown> = Parameters<typeof createResource<T, R>>

export type ResourceObject<T, R> = ResourceReturn<T, R>[0] & {
  mutate: ResourceReturn<T, R>[1]['mutate']
  refetch: ResourceReturn<T, R>[1]['refetch']
}

export function $resource<T, R = unknown>(...args: ResourceParam<T, R>): ResourceObject<T, R> {
  const [data, { mutate, refetch }] = createResource<T, R>(...args)
  const obj = data
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  obj.mutate = mutate
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  obj.refetch = refetch
  return obj as ResourceObject<T, R>
}
/**
 * alias for {@link $resource}
 */
export const $res = $resource
