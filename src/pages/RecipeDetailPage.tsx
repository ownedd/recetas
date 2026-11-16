import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../../convex/_generated/api'
import { isHttpUrl } from '../../convex/lib/recipeText'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Icon } from '../components/Icon'
import { ServingsStepper } from '../components/ServingsStepper'
import { Spinner } from '../components/Spinner'
import { isSectionHeader, scaleIngredient } from '../lib/ingredients'
import { formatMinutes } from '../lib/time'
import { NotFound } from './NotFound'

export function RecipeDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const recipe = useQuery(api.recipes.get, { id })
  const toggleFavorite = useMutation(api.recipes.toggleFavorite)
  const remove = useMutation(api.recipes.remove)
  const [servings, setServings] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (recipe === undefined) return <Spinner />
  if (recipe === null) return <NotFound message="Receta no encontrada" />

  const current = servings ?? recipe.servings
  const factor = recipe.servings && current ? current / recipe.servings : 1
  const total = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)
  const times = [
    ['Preparación', recipe.prepMinutes],
    ['Cocción', recipe.cookMinutes],
    ['Total', total],
  ] as const
  const cookUrl = `/receta/${recipe._id}/cocinar${current ? `?porciones=${current}` : ''}`

  return (
    <article className="animate-rise pb-10">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link to="/" className="btn-icon" aria-label="Volver a mis recetas">
          <Icon name="back" />
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            className={`btn-icon ${recipe.favorite ? 'text-saffron' : ''}`}
            aria-label={recipe.favorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
            aria-pressed={recipe.favorite}
            onClick={() => void toggleFavorite({ id: recipe._id })}
          >
            <Icon name="star" filled={recipe.favorite} />
          </button>
          <Link to={`/receta/${recipe._id}/editar`} className="btn-icon" aria-label="Editar receta">
            <Icon name="edit" />
          </Link>
          <button type="button" className="btn-icon text-danger" aria-label="Borrar receta" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" />
          </button>
        </div>
      </div>

      {recipe.imageUrl && (
        <img src={recipe.imageUrl} alt="" className="mb-6 aspect-[16/10] w-full rounded-card object-cover shadow-card" />
      )}

      <header>
        <h1 className="text-4xl sm:text-5xl">{recipe.title}</h1>
        {recipe.description && <p className="mt-3 text-lg text-ink-soft">{recipe.description}</p>}
        {recipe.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.tags.map((t) => (
              <span key={t} className="chip text-herb">
                #{t}
              </span>
            ))}
          </div>
        )}
        {total > 0 && (
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
            {times.map(([label, min]) =>
              min ? (
                <div key={label}>
                  <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{label}</dt>
                  <dd className="font-display text-xl">{formatMinutes(min)}</dd>
                </div>
              ) : null,
            )}
          </dl>
        )}
        <Link to={cookUrl} className="btn-primary mt-6 h-14 w-full text-lg sm:w-auto">
          <Icon name="pot" /> Empezar a cocinar
        </Link>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">Ingredientes</h2>
            {recipe.servings && current && <ServingsStepper value={current} onChange={setServings} />}
          </div>
          {recipe.ingredients.length === 0 ? (
            <p className="text-ink-soft">Sin ingredientes.</p>
          ) : (
            <ul className="divide-y divide-dashed divide-line rounded-card border border-line bg-card px-4">
              {recipe.ingredients.map((line, i) =>
                isSectionHeader(line) ? (
                  <li key={i} className="pt-4 pb-2 font-display text-lg text-pimenton">
                    {line}
                  </li>
                ) : (
                  <li key={i} className="flex gap-3 py-3">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-pimenton" />
                    {scaleIngredient(line, factor)}
                  </li>
                ),
              )}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl">Preparación</h2>
          {recipe.steps.length === 0 ? (
            <p className="text-ink-soft">Sin pasos.</p>
          ) : (
            <ol className="space-y-5">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pimenton font-display text-card">
                    {i + 1}
                  </span>
                  <p className="pt-1">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {(recipe.notes || (recipe.sourceUrl && isHttpUrl(recipe.sourceUrl))) && (
        <aside className="mt-10 rounded-card border-l-4 border-saffron bg-card p-5">
          {recipe.notes && (
            <>
              <h2 className="text-xl">Notas</h2>
              <p className="mt-2 whitespace-pre-line">{recipe.notes}</p>
            </>
          )}
          {recipe.sourceUrl && isHttpUrl(recipe.sourceUrl) && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 font-semibold break-all text-pimenton underline"
            >
              <Icon name="link" className="size-4 shrink-0" /> Ver receta original
            </a>
          )}
        </aside>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Borrar esta receta?"
        message={`«${recipe.title}» se borrará para siempre, junto con su foto.`}
        confirmLabel="Borrar"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false)
          const id = recipe._id
          navigate('/', { replace: true })
          await remove({ id })
        }}
      />
    </article>
  )
}
