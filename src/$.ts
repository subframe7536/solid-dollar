import type { Signal } from 'solid-js'
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
    && 'set' in val
    && typeof val.set === 'function'
    && 'signal' in val
    && Array.isArray(val.signal)
    && val.signal[1] === val.set
  )
}

export function $<T>(...args: []): SignalObject<T | undefined>
export function $<T>(...args: [Signal<T>]): SignalObject<T>
export function $<T>(...args: SignalParam<T>): SignalObject<T>
export function $<T>(...args: [] | [Signal<T>] | SignalParam<T>) {
  const [value, setValue] = args.length === 0
    ? createSignal<T>()
    : isSignal<T>(args[0])
      ? args[0]
      : createSignal(...args as SignalParam<T>)
  const obj = () => value()
  obj.set = setValue
  obj.signal = Object.freeze([value, setValue])

  return obj
}
export const $signal = $
