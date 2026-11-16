import { useState } from 'react'
import { normalizeTags } from '../../convex/lib/recipeText'
import { Icon } from './Icon'

export function TagInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[]
  onChange(tags: string[]): void
  suggestions: string[]
}) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const next = normalizeTags([...value, ...raw.split(',')])
    if (next.length !== value.length) onChange(next)
    setDraft('')
  }

  const needle = draft.trim().toLowerCase()
  const options = suggestions
    .filter((s) => !value.includes(s) && (!needle || s.includes(needle)))
    .slice(0, 8)

  return (
    <div>
      <div className="field flex flex-wrap items-center gap-2 py-2">
        {value.map((t) => (
          <span key={t} className="chip chip-active gap-1 pr-1.5">
            {t}
            <button
              type="button"
              aria-label={`Quitar etiqueta ${t}`}
              className="grid size-7 place-items-center rounded-full hover:bg-card/20"
              onClick={() => onChange(value.filter((x) => x !== t))}
            >
              <Icon name="close" className="size-4" />
            </button>
          </span>
        ))}
        <input
          id="tags"
          value={draft}
          onChange={(e) => {
            const v = e.target.value
            if (v.includes(',')) add(v)
            else setDraft(v)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (draft.trim()) add(draft)
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? '' : 'postres, rápidas…'}
          className="min-h-9 min-w-32 flex-1 bg-transparent outline-none"
        />
      </div>
      {options.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((s) => (
            <button key={s} type="button" className="chip" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
