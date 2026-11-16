import { useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../convex/_generated/api'
import { Icon } from '../components/Icon'
import { RecipeCard } from '../components/RecipeCard'
import { Spinner } from '../components/Spinner'

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function RecipeListPage() {
  const [text, setText] = useState('')
  const [tag, setTag] = useState<string | undefined>()
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const query = useDebounced(text.trim(), 250)

  const tags = useQuery(api.recipes.tags)
  const listed = useQuery(api.recipes.list, query ? 'skip' : { tag, favoritesOnly })
  const searched = useQuery(api.recipes.search, query ? { query, tag } : 'skip')
  const results = query ? searched?.filter((r) => !favoritesOnly || r.favorite) : listed

  const noRecipesAtAll = !query && !tag && !favoritesOnly && results?.length === 0

  return (
    <>
      <section className="animate-rise pt-2 pb-6">
        <h1 className="text-4xl sm:text-5xl">Mis recetas</h1>
        <label className="relative mt-5 block">
          <span className="sr-only">Buscar recetas</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Busca por nombre o ingrediente"
            className="field rounded-full py-3.5 pl-12"
          />
        </label>
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap">
          <button
            type="button"
            onClick={() => setFavoritesOnly((f) => !f)}
            className={`chip shrink-0 gap-1.5 ${favoritesOnly ? 'chip-active' : ''}`}
            aria-pressed={favoritesOnly}
          >
            <Icon name="star" filled={favoritesOnly} className="size-4" />
            Favoritas
          </button>
          {tags?.map(({ tag: t, count }) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag((cur) => (cur === t ? undefined : t))}
              className={`chip shrink-0 ${tag === t ? 'chip-active' : ''}`}
              aria-pressed={tag === t}
            >
              {t}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      </section>

      {results === undefined ? (
        <Spinner />
      ) : noRecipesAtAll ? (
        <div className="animate-rise rounded-card border-2 border-dashed border-line px-6 py-16 text-center">
          <Icon name="pot" className="mx-auto size-14 text-pimenton" />
          <p className="mt-4 font-display text-2xl">Aún no tienes recetas.</p>
          <p className="mt-1 text-ink-soft">¡Agrega la primera!</p>
          <Link to="/receta/nueva" className="btn-primary mt-6">
            <Icon name="plus" /> Nueva receta
          </Link>
        </div>
      ) : results.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">
          {query ? `No encontramos recetas con «${query}»` : 'No hay recetas con estos filtros'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r, i) => (
            <RecipeCard key={r._id} recipe={r} index={i} />
          ))}
        </div>
      )}

      <Link
        to="/receta/nueva"
        className="btn-primary fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-10 h-14 px-6 text-lg shadow-lg"
      >
        <Icon name="plus" /> Nueva receta
      </Link>
    </>
  )
}
