import type { Accessor, Setter, Signal } from 'solid-js'
import { createSignal, untrack } from 'solid-js'

export type SignalParam<T> = Parameters<typeof createSignal<T>>

export type SignalObject<T> = {
  (): T
  (setter: Parameters<Setter<T>>[0]): T
  readonly source: Signal<T>
}

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
    return setter ? (signal[1] as Setter<T>)(setter) : signal[0]()
  }
  obj.source = Object.freeze(signal)
  return obj
}
export function $untrack<T>(signal: Accessor<T> | SignalObject<T>): T {
  return untrack(signal)
}
/**
 * @alias {@link $signal}
 */
export const $ = $signal
/**
 * @alias {@link $untrack}
 */
export const $$ = $untrack