import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div
      role="status"
      className="animate-rise fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-card border border-line bg-card p-3 pl-5 shadow-card"
    >
      <p className="flex-1 font-semibold">Hay una nueva versión</p>
      <button type="button" className="btn-ghost" onClick={() => setNeedRefresh(false)}>
        Luego
      </button>
      <button type="button" className="btn-primary" onClick={() => void updateServiceWorker(true)}>
        Actualizar
      </button>
    </div>
  )
}
