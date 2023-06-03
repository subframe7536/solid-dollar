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
const useStore = $store('test', {
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
  <div>
    <p>{store.count}</p>
    <button onClick={double}>double</button>
    <button onClick={() => plus(2)}>plus 2</button>
  </div>
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
type WebFile = {
  /**
   * relative dir path of root exclude `.`, sep: `/`
   */
  dir: string
  name: string
  /**
   * with dot
   */
  ext: string
  /**
   * set to 0 when fail to get file
   */
  size: number
  addTime?: Date
  /**
   * set to current date when fail to get file
   */
  modifiedTime: Date
  instance: File | undefined
}

const { fetchTree, root, fileArray, handleMap } = $fs()
await fetchTree()
console.log(handleMap) // Map<string, FileSystemHandle> file/dir relative path => handle
console.log(fileArray()) // Array<FileSystemHandle>
console.log(root()) // root FileSystemHandle
```