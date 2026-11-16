import { useQuery } from 'convex/react'
import { useEffect, useReducer, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { api } from '../../convex/_generated/api'
import { Icon } from '../components/Icon'
import { Spinner } from '../components/Spinner'
import { cookingReducer } from '../hooks/cooking'
import { useWakeLock } from '../hooks/useWakeLock'
import { isSectionHeader, scaleIngredient } from '../lib/ingredients'
import { parseServingsParam } from '../lib/servings'
import { NotFound } from './NotFound'

export function CookingPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const recipe = useQuery(api.recipes.get, { id })
  const [state, dispatch] = useReducer(cookingReducer, { checked: [], current: 0 })
  const wake = useWakeLock(!!recipe)
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    stepRefs.current[state.current]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [state.current])

  if (recipe === undefined) return <Spinner fullScreen />
  if (recipe === null) {
    return (
      <div className="px-4">
        <NotFound message="Receta no encontrada" />
      </div>
    )
  }

  const servings = parseServingsParam(params.get('porciones'), recipe.servings)
  const factor = recipe.servings && servings ? servings / recipe.servings : 1
  const stepCount = recipe.steps.length
  const isLast = state.current >= stepCount - 1

  return (
    <div className="min-h-dvh pb-32 text-xl leading-relaxed">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to={`/receta/${recipe._id}`} className="btn-icon shrink-0" aria-label="Salir del modo cocina">
            <Icon name="back" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-2xl">{recipe.title}</h1>
            {servings && <p className="text-base text-ink-soft">{servings} {servings === 1 ? 'porción' : 'porciones'}</p>}
          </div>
        </div>
        {!wake.supported && (
          <p className="mx-auto max-w-5xl px-4 pb-2 text-sm text-ink-soft">
            Tu navegador no puede mantener la pantalla encendida
          </p>
        )}
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="ing-title">
          <h2 id="ing-title" className="mb-3 text-3xl">
            Ingredientes
          </h2>
          <ul className="space-y-1">
            {recipe.ingredients.map((line, i) =>
              isSectionHeader(line) ? (
                <li key={i} className="pt-4 pb-1 font-display text-pimenton">
                  {line}
                </li>
              ) : (
                <li key={i}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-xl px-2 py-2 transition hover:bg-paper-deep">
                    <input
                      type="checkbox"
                      className="size-7 shrink-0 accent-herb"
                      checked={state.checked.includes(i)}
                      onChange={() => dispatch({ type: 'toggle', index: i })}
                    />
                    <span className={state.checked.includes(i) ? 'text-ink-soft line-through' : ''}>
                      {scaleIngredient(line, factor)}
                    </span>
                  </label>
                </li>
              ),
            )}
          </ul>
        </section>

        <section aria-labelledby="steps-title">
          <h2 id="steps-title" className="mb-3 text-3xl">
            Pasos
          </h2>
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => {
              const done = i < state.current
              const current = i === state.current
              return (
                <li key={i} ref={(el) => void (stepRefs.current[i] = el)}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'goto', index: i, stepCount })}
                    aria-current={current ? 'step' : undefined}
                    className={`flex w-full gap-4 rounded-card border p-4 text-left transition ${
                      current
                        ? 'border-pimenton bg-card text-2xl shadow-card'
                        : done
                          ? 'border-transparent text-ink-soft/70'
                          : 'border-transparent'
                    }`}
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-lg ${
                        current ? 'bg-pimenton text-card' : done ? 'bg-herb text-card' : 'border border-line'
                      }`}
                    >
                      {done ? <Icon name="check" className="size-5" /> : i + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      {stepCount > 0 && (
        <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <button
              type="button"
              className="btn-ghost h-16 flex-1 text-lg"
              disabled={state.current === 0}
              onClick={() => dispatch({ type: 'prev' })}
            >
              <Icon name="chevronLeft" /> Anterior
            </button>
            <span className="w-16 text-center text-base text-ink-soft">
              {state.current + 1}/{stepCount}
            </span>
            <button
              type="button"
              className="btn-primary h-16 flex-1 text-lg"
              disabled={isLast}
              onClick={() => dispatch({ type: 'next', stepCount })}
            >
              Siguiente <Icon name="chevronRight" />
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
