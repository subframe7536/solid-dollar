import type { JSX, ParentProps } from 'solid-js'
import type { Path } from 'dot-path-value'
import { getByPath } from 'dot-path-value'
import { createComponent, createContext, createSignal, useContext } from 'solid-js'

export function $i18n<T extends Record<string, Record<string, any>>>(
  { message, defaultLocale }: {
    message: T
    defaultLocale?: keyof T
  },
) {
  const availiableLocales = Object.keys(message)
  const [currentLocale, setLocale] = createSignal(
    defaultLocale ?? ((typeof navigator !== 'undefined' && navigator.language in availiableLocales)
      ? navigator.language
      : Object.keys(availiableLocales)[0] ?? ''),
  )
  const ctxData = { availiableLocales, locale, t }
  function locale(l: keyof T) {
    setLocale(l as string)
  }
  function t(path: Path<T[keyof T]>) {
    return getByPath(message[(currentLocale() as keyof T)], path)
  }
  const ctx = createContext(ctxData)
  return {
    I18nProvider: (props: ParentProps): JSX.Element =>
      createComponent(ctx.Provider, {
        value: ctxData,
        get children() {
          return props.children
        },
      }),
    $tr: () => useContext(ctx),
  }
}
