import { createResource } from 'solid-js'
import type { ResourceObject, ResourceParam } from './type'

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
