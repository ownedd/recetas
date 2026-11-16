import { useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Icon } from '../components/Icon'
import { Spinner } from '../components/Spinner'
import { TagInput } from '../components/TagInput'
import { errorMessage } from '../lib/errors'
import { resizeImage } from '../lib/image'
import { emptyForm, formToInput, recipeToForm, type FormErrors, type RecipeFormValues } from '../lib/recipeForm'
import { NotFound } from './NotFound'

type Photo = { kind: 'keep' } | { kind: 'new'; file: File; preview: string } | { kind: 'remove' }

export function RecipeEditorPage() {
  const { id } = useParams()
  const recipe = useQuery(api.recipes.get, id ? { id } : 'skip')
  if (id && recipe === undefined) return <Spinner />
  if (id && recipe === null) return <NotFound message="Receta no encontrada" />
  return (
    <Editor
      key={id ?? 'nueva'}
      recipeId={recipe?._id}
      initial={recipe ? recipeToForm(recipe) : emptyForm}
      initialImageUrl={recipe?.imageUrl ?? null}
    />
  )
}

function Editor({
  recipeId,
  initial,
  initialImageUrl,
}: {
  recipeId?: Id<'recipes'>
  initial: RecipeFormValues
  initialImageUrl: string | null
}) {
  const navigate = useNavigate()
  const tags = useQuery(api.recipes.tags)
  const create = useMutation(api.recipes.create)
  const update = useMutation(api.recipes.update)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const discardUpload = useMutation(api.files.discardUpload)

  const [values, setValues] = useState(initial)
  const [photo, setPhoto] = useState<Photo>({ kind: 'keep' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const leaving = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const dirty = useMemo(
    () => photo.kind !== 'keep' || JSON.stringify(values) !== JSON.stringify(initial),
    [values, photo, initial],
  )

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  useEffect(() => () => {
    if (photo.kind === 'new') URL.revokeObjectURL(photo.preview)
  }, [photo])

  const set = <K extends keyof RecipeFormValues>(key: K, v: RecipeFormValues[K]) =>
    setValues((cur) => ({ ...cur, [key]: v }))

  const previewUrl = photo.kind === 'new' ? photo.preview : photo.kind === 'remove' ? null : initialImageUrl

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const res = formToInput(values)
    if (!res.ok) {
      setErrors(res.errors)
      document.getElementById(Object.keys(res.errors)[0])?.focus()
      return
    }
    setErrors({})
    setSaving(true)
    let uploaded: Id<'_storage'> | undefined
    try {
      if (photo.kind === 'new') {
        const blob = await resizeImage(photo.file)
        const url = await generateUploadUrl()
        const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob })
        if (!resp.ok) throw new Error('upload')
        uploaded = ((await resp.json()) as { storageId: Id<'_storage'> }).storageId
      }
      let savedId: Id<'recipes'>
      if (recipeId) {
        const imageId = photo.kind === 'new' ? uploaded : photo.kind === 'remove' ? null : undefined
        await update({ id: recipeId, ...res.input, imageId })
        savedId = recipeId
      } else {
        savedId = await create({ ...res.input, imageId: uploaded })
      }
      leaving.current = true
      navigate(`/receta/${savedId}`, { replace: !recipeId })
    } catch (err) {
      if (uploaded) void discardUpload({ storageId: uploaded }).catch(() => {})
      setServerError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="animate-rise mx-auto max-w-2xl pb-10">
      <div className="mb-6 flex items-center gap-3">
        <Link to={recipeId ? `/receta/${recipeId}` : '/'} className="btn-icon" aria-label="Volver">
          <Icon name="back" />
        </Link>
        <h1 className="text-3xl">{recipeId ? 'Editar receta' : 'Nueva receta'}</h1>
      </div>

      {serverError && (
        <p role="alert" className="mb-5 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 font-semibold text-danger">
          {serverError}
        </p>
      )}

      <div className="space-y-6">
        <Field id="title" label="Título" error={errors.title}>
          <input
            id="title"
            className="field font-display text-xl"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Lasaña boloñesa"
            autoFocus={!recipeId}
          />
        </Field>

        <div>
          <span className="label">Foto</span>
          <div className="overflow-hidden rounded-card border border-line bg-card">
            {previewUrl ? (
              <img src={previewUrl} alt="Foto de la receta" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid aspect-[4/3] w-full place-items-center text-ink-soft hover:bg-paper-deep"
              >
                <span className="flex flex-col items-center gap-2">
                  <Icon name="image" className="size-10" />
                  Añadir foto
                </span>
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-3">
            {previewUrl && (
              <>
                <button type="button" className="btn-ghost" onClick={() => fileInput.current?.click()}>
                  Cambiar foto
                </button>
                <button
                  type="button"
                  className="btn-ghost text-danger"
                  onClick={() => setPhoto(initialImageUrl ? { kind: 'remove' } : { kind: 'keep' })}
                >
                  Quitar foto
                </button>
              </>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setPhoto({ kind: 'new', file, preview: URL.createObjectURL(file) })
              e.target.value = ''
            }}
          />
        </div>

        <Field id="description" label="Descripción breve">
          <input
            id="description"
            className="field"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="La de la abuela, con bechamel casera"
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field id="servings" label="Porciones" error={errors.servings}>
            <input id="servings" inputMode="numeric" className="field" value={values.servings} onChange={(e) => set('servings', e.target.value)} placeholder="4" />
          </Field>
          <Field id="prepMinutes" label="Prep. (min)" error={errors.prepMinutes}>
            <input id="prepMinutes" inputMode="numeric" className="field" value={values.prepMinutes} onChange={(e) => set('prepMinutes', e.target.value)} placeholder="20" />
          </Field>
          <Field id="cookMinutes" label="Cocción (min)" error={errors.cookMinutes}>
            <input id="cookMinutes" inputMode="numeric" className="field" value={values.cookMinutes} onChange={(e) => set('cookMinutes', e.target.value)} placeholder="45" />
          </Field>
        </div>

        <Field id="ingredientsText" label="Ingredientes" hint="Uno por línea. Escribe «Para la salsa:» para crear una sección.">
          <textarea
            id="ingredientsText"
            rows={8}
            className="field leading-relaxed"
            value={values.ingredientsText}
            onChange={(e) => set('ingredientsText', e.target.value)}
            placeholder={'500 g de carne molida\n1 cebolla\n2-3 dientes de ajo\nsal al gusto'}
          />
        </Field>

        <Field id="stepsText" label="Pasos" hint="Un paso por línea, o deja una línea en blanco entre pasos largos.">
          <textarea
            id="stepsText"
            rows={10}
            className="field leading-relaxed"
            value={values.stepsText}
            onChange={(e) => set('stepsText', e.target.value)}
            placeholder={'Sofríe la cebolla y el ajo.\nAgrega la carne y cocina 10 minutos.'}
          />
        </Field>

        <div>
          <label htmlFor="tags" className="label">
            Etiquetas
          </label>
          <TagInput value={values.tags} onChange={(t) => set('tags', t)} suggestions={tags?.map((t) => t.tag) ?? []} />
        </div>

        <Field id="notes" label="Notas">
          <textarea id="notes" rows={3} className="field" value={values.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Queda mejor al día siguiente." />
        </Field>

        <Field id="sourceUrl" label="De dónde salió (URL)" error={errors.sourceUrl}>
          <input id="sourceUrl" type="url" inputMode="url" className="field" value={values.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://…" />
        </Field>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 flex justify-end gap-3 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur">
        <Link to={recipeId ? `/receta/${recipeId}` : '/'} className="btn-ghost">
          Cancelar
        </Link>
        <button type="submit" className="btn-primary min-w-32" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="¿Salir sin guardar?"
        message="Perderás los cambios que hiciste en esta receta."
        confirmLabel="Salir"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </form>
  )
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
