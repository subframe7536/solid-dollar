import { describe, expect, test } from 'vitest'
import { $i18n } from '../src/i18n'

describe('i18n', () => {
  const testDict = {
    t: 1,
    tt: 2,
    deep: {
      t: 1,
    },
  }
  const testDict1 = {
    t: '1',
    tt: '2',
    deep: {
      t: '1',
    },
  }
  const { $tr } = $i18n({ message: { testDict, testDict1 }, defaultLocale: 'testDict' })
  const { t, availiableLocales, locale } = $tr()
  test('default', () => {
    expect(availiableLocales).toStrictEqual(['testDict', 'testDict1'])
    const dest = t('deep.t')
    expect(dest).toBe(1)
    locale('testDict1')
    expect(t('deep.t')).toBe('1')
  })
})
