import { Icon } from './Icon'

export function ServingsStepper({ value, onChange }: { value: number; onChange(n: number): void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-card p-1">
      <button
        type="button"
        aria-label="Menos porciones"
        className="grid size-10 place-items-center rounded-full text-ink transition hover:bg-paper-deep disabled:opacity-30"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Icon name="minus" />
      </button>
      <span className="min-w-24 text-center font-semibold" aria-live="polite">
        {value} {value === 1 ? 'porción' : 'porciones'}
      </span>
      <button
        type="button"
        aria-label="Más porciones"
        className="grid size-10 place-items-center rounded-full text-ink transition hover:bg-paper-deep"
        onClick={() => onChange(value + 1)}
      >
        <Icon name="plus" />
      </button>
    </div>
  )
}
