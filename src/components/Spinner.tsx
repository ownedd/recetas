export function Spinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const dot = <span className="size-3 animate-bounce rounded-full bg-pimenton" />
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`flex items-center justify-center gap-1.5 ${fullScreen ? 'min-h-dvh' : 'py-16'}`}
    >
      {dot}
      <span className="size-3 animate-bounce rounded-full bg-saffron [animation-delay:120ms]" />
      <span className="size-3 animate-bounce rounded-full bg-herb [animation-delay:240ms]" />
    </div>
  )
}
