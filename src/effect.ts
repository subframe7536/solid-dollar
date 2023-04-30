import type { Accessor, AccessorArray, OnOptions } from 'solid-js'
import { createEffect, createSignal, on } from 'solid-js'

import type { SignalObject } from './signal'

export type WatchCallback<T> = (
  input: T,
  /**
   * when using options.fileter, prevInput will fail to filter
   */
  prevInput: T | undefined,
  prev: unknown
) => void

export type EffectOption<T> = OnOptions & {
  /**
   * function for trigger callback, like `debounce()` or `throttle()` in `@solid-primitives/scheduled`
  */
  callFn?: ((fn: (...args: unknown[]) => void) => void)
  /**
  * function for filter value
  */
  filterFn?: (newValue: T, times: number) => boolean
}

/**
 * utils for watch Accessor, base on `createEffect(on())`
 * @param deps Accessor that need to be watch
 * @param fn {@link WatchCallback callback function}
 * @param options options
 * @returns void
 */
export function $effect<T>(
  deps: Accessor<T> | AccessorArray<T> | SignalObject<T>,
  fn: WatchCallback<T>,
  options?: EffectOption<T>,
) {
  const [isWatch, setIsWatch] = createSignal(true)
  const [callTimes, setCallTimes] = createSignal(0)
  const { callFn, defer, filterFn: filter } = options ?? {}
  const needToTriggerEffect = (newValue: T) => {
    return isWatch()
      ? filter
        ? filter(newValue, callTimes())
        : true
      : false
  }
  createEffect(
    on(
      deps,
      (input, prevInput, prev) => {
        if (!needToTriggerEffect(input)) {
          return
        }
        if (callFn) {
          callFn(() => {
            setCallTimes(time => time + 1)
            fn(input, prevInput, prev)
          })
        } else {
          setCallTimes(time => time + 1)
          fn(input, prevInput, prev)
        }
      },
      { defer: defer as any },
    ),
  )
  return {
    pause: () => setIsWatch(false),
    resume: () => setIsWatch(true),
    isWatching: () => isWatch(),
  }
}
/**
 * @alias {@link $effect}
 */
export const $watch = $effect
