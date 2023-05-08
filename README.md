# solid-dollar

hooks for solid.js

## `$`/`$signal`

`createSignal` wrapper

```ts
const data = $(0)

console.log(data()) // 0

console.log(data(1)) // 1

console.log(data()) // 1

console.log(data.signal) // original signal
```

## `$res`/`$resource`

`createResource` wrapper

```ts
const fetchUser = async (id: number) => ++id
const data = $res(t, fetchUser, { name: 'test' })

const { error, latest, loading, mutate, refetch, state } = data

consolo.log(data())
```

## `$store`

support for persist store. inspired by `@solid-primitives/context` and `pinia`

```tsx
const [Provider, useStore] = $store('test', {
  state: { test: 1 },
  getter: state => ({
    doubleValue() {
      return state.test * 2
    },
  }),
  action: set => ({
    double() {
      set('test', test => test * 2)
    },
    plus(num: number) {
      set('test', test => test + num)
    },
  }),
  persist: {
    enable: true,
    storage: localStorage,
    debug: true,
  },
})
const { store, double, plus, $patch, $reset, $subscribe } = useStore()
render(() => (
  <Provider>
    <div>
      <p>{store.count}</p>
      <button onClick={double}>double</button>
      <button onClick={() => plus(2)}>plus 2</button>
    </div>
  </Provider>
))
```

### `$Providers`

combine multiple providers

```tsx
render(() => (
  <$Providers values={[Provider1, Provider2]}>
    <div>
      <p>{store.count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  </$Providers>
))
```

## `$effect`/`$watch`

pausable and filterable watch

```ts
const str = $('old')
const callback = console.log
const filter = (newValue: string, times: number) => {
  return newValue !== 'new'
}
const { isWatching, pause, resume } = $effect(str, callback, {
  callFn: throttle,
  filterFn: filter,
  defer: true,
})
```

## `$i18n`/`$tr`

simple typed i18n

```ts
const testDict = {
  t: 1,
  tt: 2,
  deep: {
    t: 1,
  },
}
const { $tr, I18nProvider } = $i18n({ message: { testDict }, defaultLocale: 'testDict' })
const { t, availiableLocales, locale } = $tr()
t('deep.t')
locale('testDict')
```

## `$fs`

FileSystem Access Api

```ts

```