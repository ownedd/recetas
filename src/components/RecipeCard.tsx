import { Link } from 'react-router'
import type { RecipeSummary } from '../../convex/recipes'
import { formatMinutes } from '../lib/time'
import { Icon } from './Icon'

export function RecipeCard({ recipe, index }: { recipe: RecipeSummary; index: number }) {
  const total = formatMinutes((recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0))
  return (
    <Link
      to={`/receta/${recipe._id}`}
      className="group animate-rise block overflow-hidden rounded-card border border-line bg-card shadow-card transition hover:-translate-y-0.5"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-deep">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-ink-soft/40">
            <Icon name="pot" className="size-14" />
          </div>
        )}
        {recipe.favorite && (
          <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-card/90 text-saffron">
            <Icon name="star" filled className="size-5" />
          </span>
        )}
      </div>
      <div className="p-4">
        <h2 className="text-xl">{recipe.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
          {total && (
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" className="size-4" />
              {total}
            </span>
          )}
          {recipe.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-herb">
              #{t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
