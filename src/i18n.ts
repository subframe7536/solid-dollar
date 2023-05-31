import type { JSX, ParentProps } from 'solid-js'
import type { Path } from 'object-standard-path'
import { pathGet } from 'object-standard-path'
import { createComponent, createContext, useContext } from 'solid-js'
import { $ } from './signal'

export function $i18n<T extends Record<string, Record<string, any>>>(
  { message, defaultLocale }: {
    message: T
    defaultLocale?: keyof T
  },
) {
  const availiableLocales = Object.keys(message)
  const locale = $<keyof T>(
    defaultLocale ?? ((typeof navigator !== 'undefined' && navigator.language in availiableLocales)
      ? navigator.language
      : Object.keys(availiableLocales)[0] ?? 'en'),
  )
  const ctxData = { availiableLocales, locale, t }
  function t(path: Path<T[keyof T]>) {
    return pathGet(message[locale()], path)
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
