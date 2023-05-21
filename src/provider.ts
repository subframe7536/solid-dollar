import type { Context, FlowComponent } from 'solid-js'
import { createComponent } from 'solid-js'
import type { JSX } from 'solid-js/jsx-runtime'
import type { ContextProviderComponent } from 'solid-js/types/reactive/signal'

/**
 * {@link https://github.com/solidjs-community/solid-primitives/blob/main/packages/context/README.md#multiprovider solid-primitives MultiProvider}
 */
export function $Provider<T extends readonly [unknown?, ...unknown[]]>(props: {
  values: {
    [K in keyof T]:
    | readonly [
      Context<T[K]> | ContextProviderComponent<T[K]>,
      [T[K]][T extends unknown ? 0 : never],
    ]
    | FlowComponent;
  }
  children: JSX.Element
}): JSX.Element {
  const { values } = props
  const fn = (i: number) => {
    let item: any = values[i]

    if (!item) { return props.children }

    const ctxProps: { value?: any; children: JSX.Element } = {
      get children() {
        return fn(i + 1)
      },
    }
    if (Array.isArray(item)) {
      ctxProps.value = item[1]
      item = item[0]
      if (typeof item !== 'function') { item = item.Provider }
    }

    return createComponent(item, ctxProps)
  }
  return fn(0)
}
