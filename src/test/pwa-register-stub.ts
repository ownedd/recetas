// Sustituto de `virtual:pwa-register/react` en pruebas (el módulo virtual solo existe en el build).
export function useRegisterSW() {
  const noop = () => {}
  return {
    needRefresh: [false, noop] as const,
    offlineReady: [false, noop] as const,
    updateServiceWorker: async () => {},
  }
}
