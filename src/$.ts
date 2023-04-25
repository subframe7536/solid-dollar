import type { Signal } from 'solid-js'
import { createSignal } from 'solid-js'

type SignalReturn<T> = ReturnType<typeof createSignal<T>>
type SignalParam<T> = Parameters<typeof createSignal<T>>

interface SignalObject<T> {
  (): T
  set: SignalReturn<T>[1]
  readonly signal: SignalReturn<T>
}

function isSignal<T>(val: unknown): val is Signal<T> {
  return (
    Array.isArray(val)
    && val.length === 2
    && typeof val[0] === 'function'
    && typeof val[1] === 'function'
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
