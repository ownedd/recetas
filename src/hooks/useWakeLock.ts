import { useEffect, useState } from 'react'

type Sentinel = EventTarget & { release(): Promise<void> }
type WakeLockApi = { request(type: 'screen'): Promise<Sentinel> }

function getWakeLock(): WakeLockApi | undefined {
  return (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock
}

/** Mantiene la pantalla encendida mientras `active` sea true; lo vuelve a pedir al regresar a la pestaña. */
export function useWakeLock(active: boolean): { supported: boolean; locked: boolean } {
  const supported = typeof navigator !== 'undefined' && !!getWakeLock()
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const api = getWakeLock()
    if (!active || !api) return
    let sentinel: Sentinel | null = null
    let disposed = false

    const onRelease = () => {
      sentinel = null
      if (!disposed) setLocked(false)
    }

    const acquire = async () => {
      if (disposed || sentinel || document.visibilityState !== 'visible') return
      try {
        const s = await api.request('screen')
        if (disposed) {
          void s.release()
          return
        }
        sentinel = s
        s.addEventListener('release', onRelease)
        setLocked(true)
      } catch {
        setLocked(false)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (sentinel) {
        sentinel.removeEventListener('release', onRelease)
        void sentinel.release()
      }
      setLocked(false)
    }
  }, [active])

  return { supported, locked }
}
