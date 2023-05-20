import { createEffect, createSignal, onCleanup, untrack } from 'solid-js'

/**
 * Executes a callback function when the browser is idle, using the requestIdleCallback API
 * if available, or requestAnimationFrame if not. If neither API is available, the callback
 * is executed immediately.
 *
 * @param {() => void} callback - The function to execute when the browser is idle.
 * @param {IdleRequestOptions} [options] - Optional configuration options for the idle callback.
 * @return {void} This function does not return anything.
 */
export function $idle(
  callback: () => void,
  options?: IdleRequestOptions,
): void {
  const [handle, setHandle] = createSignal<number>()
  const canUseIdleCallback = 'requestIdleCallback' in window
  const canUseAnimationFrame = 'requestAnimationFrame' in window

  createEffect(() => {
    if (canUseIdleCallback) {
      untrack(() => setHandle(window.requestIdleCallback(callback, options)))
    } else if (canUseAnimationFrame) {
      untrack(() => setHandle((window as Window).requestAnimationFrame(callback)))
    } else {
      callback()
    }

    onCleanup(() => {
      const currentHandle = handle()

      if (currentHandle == null) {
        return
      }

      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(currentHandle)
      } else if ('cancelAnimationFrame' in window) {
        (window as Window).cancelAnimationFrame(currentHandle)
      }
    })
  })
}
