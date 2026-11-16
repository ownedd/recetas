import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

type Sentinel = EventTarget & { release: ReturnType<typeof vi.fn>; released: boolean }

function makeSentinel(): Sentinel {
  const s = new EventTarget() as Sentinel
  s.released = false
  s.release = vi.fn(async () => {
    s.released = true
    s.dispatchEvent(new Event('release'))
  })
  return s
}

function installWakeLock(request: (...args: unknown[]) => Promise<unknown>) {
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  delete (navigator as { wakeLock?: unknown }).wakeLock
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})

test('pide el bloqueo y lo libera al desmontar', async () => {
  const sentinel = makeSentinel()
  const request = vi.fn(async () => sentinel)
  installWakeLock(request)
  const { result, unmount } = renderHook(() => useWakeLock(true))
  await waitFor(() => expect(result.current.locked).toBe(true))
  expect(result.current.supported).toBe(true)
  expect(request).toHaveBeenCalledWith('screen')
  unmount()
  expect(sentinel.release).toHaveBeenCalled()
})

test('vuelve a pedirlo al regresar a la pestaña', async () => {
  const sentinels: Sentinel[] = []
  const request = vi.fn(async () => {
    const s = makeSentinel()
    sentinels.push(s)
    return s
  })
  installWakeLock(request)
  const { result } = renderHook(() => useWakeLock(true))
  await waitFor(() => expect(result.current.locked).toBe(true))
  // el navegador suelta el bloqueo al ocultar la pestaña
  await act(async () => {
    setVisibility('hidden')
    sentinels[0].dispatchEvent(new Event('release'))
  })
  expect(result.current.locked).toBe(false)
  await act(async () => setVisibility('visible'))
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
  await waitFor(() => expect(result.current.locked).toBe(true))
})

test('sin soporte no falla', () => {
  const { result } = renderHook(() => useWakeLock(true))
  expect(result.current).toEqual({ supported: false, locked: false })
})

test('si request rechaza, locked sigue false', async () => {
  const request = vi.fn(async () => {
    throw new Error('NotAllowedError')
  })
  installWakeLock(request)
  const { result } = renderHook(() => useWakeLock(true))
  await waitFor(() => expect(request).toHaveBeenCalled())
  expect(result.current.locked).toBe(false)
})
