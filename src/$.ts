import type { Setter, Signal } from 'solid-js'
import { createSignal } from 'solid-js'

import type { SignalObject, SignalParam } from './type'

export function isSignal<T>(val: unknown): val is Signal<T> {
  return (
    Array.isArray(val)
    && val.length === 2
    && typeof val[0] === 'function'
    && typeof val[1] === 'function'
  )
}

export function isSignalObject<T>(val: unknown): val is SignalObject<T> {
  return (
    typeof val === 'function'
    && 'source' in val
    && isSignal(val.source)
  )
}

export function $signal<T>(...args: []): SignalObject<T | undefined>
export function $signal<T>(...args: [Signal<T>]): SignalObject<T>
export function $signal<T>(...args: SignalParam<T>): SignalObject<T>
export function $signal<T>(...args: [] | [Signal<T>] | SignalParam<T>) {
  const signal = args.length === 0
    ? createSignal<T>()
    : isSignal<T>(args[0])
      ? args[0]
      : createSignal(...args as SignalParam<T>)
  const obj = (setter?: Parameters<Setter<T>>[0]) => {
    setter && (signal[1] as Setter<T>)(setter)
    return signal[0]()
  }
  obj.source = Object.freeze(signal)
  return obj
}
/**
 * alias for {@link $signal}
 */
export const $ = $signal
