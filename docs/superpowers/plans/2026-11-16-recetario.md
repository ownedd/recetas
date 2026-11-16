# Recetario — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una PWA de recetario personal (Vite + React) con datos en Convex, login con Clerk por invitación, desplegable en Vercel.

**Architecture:** SPA en el navegador que habla directo con Convex (queries en tiempo real) autenticada con el JWT de Clerk. La lógica pura (detección de cantidades, normalización de texto, formularios) vive en módulos sin dependencias y se prueba con Vitest; las funciones de Convex se prueban con `convex-test`. `vite-plugin-pwa` precachea solo el app shell.

**Tech Stack:** React 19.3.1, Vite 8.3.8, TypeScript 7.0.2, Tailwind 4.3.5, Convex 1.50.0, @clerk/react 6.18.8, react-router 8.5.1, vite-plugin-pwa 2.0.0, Vitest 5.1.0, convex-test 0.0.71.

**Spec:** `docs/superpowers/specs/2026-11-16-recetario-design.md`

## Global Constraints

- Proyecto en `C:\Users\edgar\Documents\personal\recetario` (repo git nuevo, rama `main`).
- Versiones exactas (sin `^`) de la tabla del spec §5: react/react-dom 19.3.1, vite 8.3.8, @vitejs/plugin-react 6.3.0, tailwindcss y @tailwindcss/vite 4.3.5, convex 1.50.0, @clerk/react 6.18.8, react-router 8.5.1, vite-plugin-pwa 2.0.0, vitest 5.1.0, convex-test 0.0.71, typescript 7.0.2. Extras de prueba: @testing-library/react 16.3.3, @testing-library/jest-dom 7.0.1, jsdom 31.0.1, @edge-runtime/vm 5.0.0, @vite-pwa/assets-generator 2.0.0. Si TypeScript 7 rompe alguna herramienta, bajar a la última 6.x y anotarlo en el README.
- **No usar `@clerk/clerk-react`** (deprecado).
- Toda la interfaz y los mensajes de error en **español**.
- TypeScript en modo `strict`.
- Recetas **privadas**: toda función de Convex deriva el usuario de `ctx.auth.getUserIdentity().tokenIdentifier`; nunca acepta `userId` del cliente.
- Registro **solo por invitación**: no hay enlace público de "crear cuenta".
- El service worker **no** cachea datos de Convex ni de Clerk.
- Ingredientes y pasos se guardan como texto (`string[]`); la cantidad se detecta solo al mostrar.

## Review Focus

1. **Receta sin porciones (o URL con `?porciones=abc`)**: no aparece el selector de porciones, nada se divide por cero, se muestran las cantidades originales. → pruebas en Task 2 (`parseServingsParam`) y Task 8.
2. **Abrir `/receta/<id>` inválido, borrado o de otro usuario**: se ve "Receta no encontrada", sin pantalla en blanco. → `recipes.get` acepta `string` y devuelve `null` (Task 4) y la página lo maneja (Task 8).
3. **Cantidades malformadas** (`1/0 taza`, `1/ taza`, `2-` …): la línea se muestra tal cual, sin `NaN` ni `Infinity`. → pruebas en Task 2.
4. **La pantalla se apaga al volver a la pestaña**: el Wake Lock se pierde cuando la pestaña se oculta; debe volver a pedirse al estar visible otra vez. → prueba en Task 9.
5. **`sourceUrl` con `javascript:`**: el enlace de origen nunca ejecuta código; solo se aceptan `http://` y `https://`, en cliente (Task 3) y servidor (Task 4).

---

## Estructura de archivos

```
recetario/
  convex/
    schema.ts              tabla recipes + índices
    auth.config.ts         proveedor Clerk
    lib/auth.ts            requireUserId
    lib/recipeText.ts      normalizeTags, buildSearchText, isHttpUrl (compartido con el cliente)
    recipes.ts             queries y mutations de recetas
    files.ts               generateUploadUrl
    recipes.test.ts        convex-test
  src/
    main.tsx               monta providers + router
    providers.tsx          ClerkProvider + ConvexProviderWithClerk
    router.tsx             createBrowserRouter + RequireAuth
    lib/ingredients.ts     parseIngredient, formatQuantity, scaleIngredient, isSectionHeader
    lib/servings.ts        parseServingsParam
    lib/normalize.ts       normalizeIngredients, normalizeSteps
    lib/recipeForm.ts      RecipeFormValues, recipeToForm, formToInput
    lib/time.ts            formatMinutes
    lib/image.ts           fitWithin, resizeImage
    hooks/useWakeLock.ts
    hooks/cooking.ts       cookingReducer, useCooking
    components/            Layout, RecipeCard, TagInput, ServingsStepper, ConfirmDialog, UpdatePrompt
    pages/                 SignInPage, SignUpPage, RecipeListPage, RecipeDetailPage, RecipeEditorPage, CookingPage, NotFound
    test/setup.ts          jest-dom
  public/logo.svg
  vercel.json
  README.md
```

---

### Task 1: Proyecto base

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/index.css`, `src/test/setup.ts`, `src/smoke.test.ts`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces: scripts `dev`, `build` (`tsc -b && vite build`), `test` (`vitest run`), `typecheck` (`tsc -b --noEmit`); Tailwind cargado vía `@import "tailwindcss";` en `src/index.css`.

- [ ] **Step 1:** `git init -b main` en `recetario/` (ya contiene `docs/`). Crear el proyecto con `npm create vite@latest . -- --template react-ts` (si se niega por carpeta no vacía, crearlo en una subcarpeta temporal y mover los archivos).
- [ ] **Step 2:** Fijar versiones exactas de Global Constraints con `npm install -E` y `npm install -E -D`. Añadir `@tailwindcss/vite` a `vite.config.ts`. Vitest: `test: { environment: "jsdom", setupFiles: ["src/test/setup.ts"] }`.
- [ ] **Step 3:** Escribir `src/smoke.test.ts`: `expect(1 + 1).toBe(2)`.
- [ ] **Step 4:** Ejecutar `npm test` → PASS; `npm run build` → sin errores.
- [ ] **Step 5:** `.gitignore` incluye `node_modules`, `dist`, `.env.local`, `dev-dist`. `.env.example` con `VITE_CONVEX_URL=` y `VITE_CLERK_PUBLISHABLE_KEY=`.
- [ ] **Step 6:** Commit: `chore: proyecto base Vite + React + Tailwind + Vitest` (incluye el spec y este plan).

---

### Task 2: Detección de cantidades y escalado

**Files:**
- Create: `src/lib/ingredients.ts`, `src/lib/servings.ts`
- Test: `src/lib/ingredients.test.ts`, `src/lib/servings.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Quantity = { kind: "single"; value: number } | { kind: "range"; min: number; max: number };
  export function isSectionHeader(line: string): boolean;          // trim().endsWith(":")
  export function parseIngredient(line: string): { quantity: Quantity | null; rest: string; raw: string };
  export function formatQuantity(n: number): string;
  export function scaleIngredient(line: string, factor: number): string;
  export function parseServingsParam(param: string | null, base: number | undefined): number | undefined;
  ```

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// parseIngredient
expect(parseIngredient("500 g carne").quantity).toEqual({ kind: "single", value: 500 });
expect(parseIngredient("500 g carne").rest).toBe(" g carne");   // rest = texto tras la cantidad, literal
expect(parseIngredient("1/2 taza").quantity).toEqual({ kind: "single", value: 0.5 });
expect(parseIngredient("1 1/2 tazas").quantity).toEqual({ kind: "single", value: 1.5 });
expect(parseIngredient("½ cebolla").quantity).toEqual({ kind: "single", value: 0.5 });
expect(parseIngredient("1½ tazas").quantity).toEqual({ kind: "single", value: 1.5 });
expect(parseIngredient("0,5 kg").quantity).toEqual({ kind: "single", value: 0.5 });
expect(parseIngredient("1.5 l").quantity).toEqual({ kind: "single", value: 1.5 });
expect(parseIngredient("1.000 g harina").quantity).toEqual({ kind: "single", value: 1000 }); // punto + 3 dígitos = miles
expect(parseIngredient("2-3 dientes").quantity).toEqual({ kind: "range", min: 2, max: 3 });
expect(parseIngredient("2 a 3 dientes").quantity).toEqual({ kind: "range", min: 2, max: 3 });
expect(parseIngredient("sal al gusto").quantity).toBeNull();
expect(parseIngredient("una taza de leche").quantity).toBeNull();   // palabras NO se interpretan (decisión: evita "2 una taza")
expect(parseIngredient("1/0 taza").quantity).toBeNull();
expect(parseIngredient("1/ taza").quantity).toBeNull();

// formatQuantity
expect(formatQuantity(2)).toBe("2");
expect(formatQuantity(0.5)).toBe("½");
expect(formatQuantity(1.5)).toBe("1½");
expect(formatQuantity(1 / 3)).toBe("⅓");
expect(formatQuantity(0.75)).toBe("¾");
expect(formatQuantity(0.4)).toBe("0,4");
expect(formatQuantity(33.333)).toBe("33");    // ≥ 10 → entero
expect(formatQuantity(2.125)).toBe("2,13");   // máximo 2 decimales, coma decimal

// scaleIngredient
expect(scaleIngredient("500 g carne", 0.5)).toBe("250 g carne");
expect(scaleIngredient("1 cebolla", 0.5)).toBe("½ cebolla");
expect(scaleIngredient("3 huevos", 0.5)).toBe("1½ huevos");
expect(scaleIngredient("2-3 dientes de ajo", 2)).toBe("4-6 dientes de ajo");   // conserva el separador original
expect(scaleIngredient("2 a 3 dientes", 2)).toBe("4 a 6 dientes");
expect(scaleIngredient("sal al gusto", 2)).toBe("sal al gusto");
expect(scaleIngredient("Para la salsa:", 2)).toBe("Para la salsa:");
expect(scaleIngredient("1/0 taza", 2)).toBe("1/0 taza");
expect(scaleIngredient("500 g carne", 1)).toBe("500 g carne");                 // factor 1 → línea intacta

// parseServingsParam
expect(parseServingsParam("2", 4)).toBe(2);
expect(parseServingsParam(null, 4)).toBe(4);
expect(parseServingsParam("abc", 4)).toBe(4);
expect(parseServingsParam("0", 4)).toBe(4);
expect(parseServingsParam("2", undefined)).toBeUndefined();   // sin porciones base no hay escalado
```

- [ ] **Step 2:** `npx vitest run src/lib` → FAIL (módulos no existen).
- [ ] **Step 3:** Implementar. Reglas no obvias:
  - Solo se reconoce la cantidad al **inicio** de la línea (tras espacios).
  - Fracciones unicode: `¼ ½ ¾ ⅓ ⅔`. Denominador 0 o fracción incompleta → `null`.
  - `formatQuantity`: si `|n − round(n)| < 0.01` → entero; si `n ≥ 10` → entero redondeado; si la parte decimal está a < 0.02 de ¼, ⅓, ½, ⅔ o ¾ → parte entera (si > 0) + carácter unicode, sin espacio; si no → 2 decimales máx., sin ceros finales, coma decimal.
  - `scaleIngredient` reconstruye `formatQuantity(...) + rest`, y para rangos usa el separador literal encontrado.
  - `parseServingsParam`: si `base` es `undefined` → `undefined`; si `param` es un entero ≥ 1 → ese valor; si no → `base`.
- [ ] **Step 4:** `npx vitest run src/lib` → PASS.
- [ ] **Step 5:** Commit `feat: detección de cantidades y escalado de ingredientes`.

---

### Task 3: Normalización de texto y formulario de receta

**Files:**
- Create: `convex/lib/recipeText.ts`, `src/lib/normalize.ts`, `src/lib/recipeForm.ts`, `src/lib/time.ts`
- Test: `src/lib/normalize.test.ts`, `src/lib/recipeForm.test.ts`, `src/lib/time.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // convex/lib/recipeText.ts (lo importan el servidor y el cliente)
  export function normalizeTags(tags: string[]): string[];        // trim, minúsculas, espacios internos colapsados, sin vacías, sin duplicados, orden de entrada
  export function buildSearchText(r: { title: string; ingredients: string[]; tags: string[] }): string; // unidos con " "
  export function isHttpUrl(s: string): boolean;                   // empieza con http:// o https:// (sin distinguir mayúsculas)

  // src/lib/normalize.ts
  export function normalizeIngredients(text: string): string[];
  export function normalizeSteps(text: string): string[];

  // src/lib/recipeForm.ts
  export type RecipeInput = {
    title: string; description?: string; servings?: number; prepMinutes?: number; cookMinutes?: number;
    ingredients: string[]; steps: string[]; tags: string[]; notes?: string; sourceUrl?: string;
  };
  export type RecipeFormValues = {
    title: string; description: string; servings: string; prepMinutes: string; cookMinutes: string;
    ingredientsText: string; stepsText: string; tags: string[]; notes: string; sourceUrl: string;
  };
  export const emptyForm: RecipeFormValues;
  export function recipeToForm(r: RecipeInput): RecipeFormValues;  // ingredientes unidos con "\n", pasos con "\n\n"
  export function formToInput(v: RecipeFormValues):
    | { ok: true; input: RecipeInput }
    | { ok: false; errors: Partial<Record<keyof RecipeFormValues, string>> };

  // src/lib/time.ts
  export function formatMinutes(min: number | undefined): string;
  ```

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
expect(normalizeIngredients("• 2 huevos\n\n- 2-3 dientes de ajo\n * sal \n")).toEqual(["2 huevos", "2-3 dientes de ajo", "sal"]);
expect(normalizeIngredients("-2 grados")).toEqual(["-2 grados"]);          // viñeta exige espacio después
expect(normalizeSteps("1. Picar\n2) Sofreír\nPaso 3: Servir")).toEqual(["Picar", "Sofreír", "Servir"]);
expect(normalizeSteps("Picar la cebolla\nmuy fina.\n\nSofreír.")).toEqual(["Picar la cebolla muy fina.", "Sofreír."]);
expect(normalizeSteps("a\r\nb")).toEqual(["a", "b"]);
expect(normalizeSteps("  \n\n ")).toEqual([]);

expect(normalizeTags([" Postres", "postres", "", "Comida  rápida"])).toEqual(["postres", "comida rápida"]);
expect(isHttpUrl("https://x.com")).toBe(true);
expect(isHttpUrl("javascript:alert(1)")).toBe(false);

const r = { title: "Tortilla", servings: 4, ingredients: ["4 huevos", "Para la salsa:"], steps: ["Batir.", "Cuajar."], tags: ["rápidas"] };
expect(formToInput(recipeToForm(r))).toEqual({ ok: true, input: r });      // ida y vuelta sin pérdidas
expect(formToInput({ ...emptyForm, title: "  " })).toMatchObject({ ok: false, errors: { title: "El título es obligatorio" } });
expect(formToInput({ ...emptyForm, title: "x", servings: "0" })).toMatchObject({ ok: false, errors: { servings: "Las porciones deben ser un número entero mayor que 0" } });
expect(formToInput({ ...emptyForm, title: "x", prepMinutes: "-5" })).toMatchObject({ ok: false, errors: { prepMinutes: "Debe ser un número entero de minutos" } });
expect(formToInput({ ...emptyForm, title: "x", sourceUrl: "javascript:alert(1)" })).toMatchObject({ ok: false, errors: { sourceUrl: "La URL debe empezar con http:// o https://" } });

expect(formatMinutes(45)).toBe("45 min");
expect(formatMinutes(60)).toBe("1 h");
expect(formatMinutes(90)).toBe("1 h 30 min");
expect(formatMinutes(undefined)).toBe("");
expect(formatMinutes(0)).toBe("");
```

- [ ] **Step 2:** `npx vitest run src/lib` → FAIL.
- [ ] **Step 3:** Implementar. Viñetas: `/^[•\-*·–]\s+/`. Numeración de pasos: `/^(paso\s+\d+\s*[:.)-]?|\d+\s*[.)])\s*/i`. Separación de pasos: si el texto (con `\r\n` → `\n`) contiene `/\n\s*\n/`, cada bloque es un paso (líneas internas unidas con un espacio); si no, cada línea es un paso. Campos de texto opcionales vacíos → `undefined` en `RecipeInput`. Minutos: entero ≥ 0.
- [ ] **Step 4:** `npx vitest run src/lib` → PASS.
- [ ] **Step 5:** Commit `feat: normalización de texto pegado y formulario de receta`.

---

### Task 4: Backend Convex

**Files:**
- Create: `convex/schema.ts`, `convex/auth.config.ts`, `convex/lib/auth.ts`, `convex/recipes.ts`, `convex/files.ts`
- Test: `convex/recipes.test.ts` (primera línea `// @vitest-environment edge-runtime`)

**Interfaces:**
- Consumes: `normalizeTags`, `buildSearchText`, `isHttpUrl` (Task 3).
- Produces (las usan las Tasks 6–9 vía `api.recipes.*`, `api.files.*`):
  ```ts
  // tabla recipes: campos exactos del spec §6.2; índices "by_user_updated" ["userId","updatedAt"]
  // y searchIndex "search_text" { searchField: "searchText", filterFields: ["userId"] }
  export type RecipeSummary = { _id: Id<"recipes">; title: string; imageUrl: string | null; prepMinutes?: number; cookMinutes?: number; tags: string[]; favorite: boolean };
  recipes.list({ tag?: string, favoritesOnly?: boolean }): RecipeSummary[]       // updatedAt desc
  recipes.search({ query: string, tag?: string }): RecipeSummary[]               // query vacía → []; máx. 50
  recipes.get({ id: string }): (Doc<"recipes"> & { imageUrl: string | null }) | null  // id inválido/ajeno/borrado → null
  recipes.tags(): { tag: string; count: number }[]                               // count desc, luego alfabético
  recipes.create(RecipeInput & { imageId?: Id<"_storage"> }): Id<"recipes">
  recipes.update({ id: Id<"recipes"> } & RecipeInput & { imageId?: Id<"_storage"> | null }): null  // undefined = conservar, null = quitar
  recipes.toggleFavorite({ id: Id<"recipes"> }): null
  recipes.remove({ id: Id<"recipes"> }): null
  files.generateUploadUrl(): string
  // convex/lib/auth.ts
  export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<string>; // tokenIdentifier o ConvexError("No autenticado")
  ```

- [ ] **Step 1:** `convex/auth.config.ts`: `providers: [{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN!, applicationID: "convex" }]`. Generar `convex/_generated` sin cuenta: `CONVEX_AGENT_MODE=anonymous npx convex dev --once` (despliegue local anónimo). Añadir a `.gitignore` lo que ese comando pida ignorar (`.convex/`); `convex/_generated` **sí** se versiona.
- [ ] **Step 2: Escribir las pruebas que fallan** (con `convexTest(schema, import.meta.glob("./**/*.ts"))`; usuarios `t.withIdentity({ tokenIdentifier: "ana" })` y `"beto"`):
  - `create` sin identidad → lanza "No autenticado".
  - Ana crea "Tortilla" con tags `[" Rápidas", "rápidas"]` → `get` devuelve `tags: ["rápidas"]`, `favorite: false`, `searchText` contiene "Tortilla" y los ingredientes.
  - `create` con título `"  "` → error "El título es obligatorio"; `servings: 0` → "Las porciones deben ser un número entero mayor que 0"; `sourceUrl: "javascript:x"` → "La URL debe empezar con http:// o https://".
  - Beto: `get` de la receta de Ana → `null`; `list` → `[]`; `update`/`remove`/`toggleFavorite` → error "Receta no encontrada".
  - `get({ id: "basura" })` → `null`.
  - `list` devuelve la más recientemente actualizada primero; `list({ tag: "rápidas" })` filtra; `list({ favoritesOnly: true })` tras `toggleFavorite` devuelve solo esa.
  - `search({ query: "huevo" })` encuentra por ingrediente y no devuelve recetas de Beto; `search({ query: "  " })` → `[]`; `search({ query: "huevo", tag: "postres" })` solo devuelve recetas con esa etiqueta.
  - `tags()` con dos recetas `["postres"]` y `["postres","rápidas"]` → `[{tag:"postres",count:2},{tag:"rápidas",count:1}]`.
  - Foto: subir con `t.run(ctx => ctx.storage.store(new Blob([...], { type: "image/jpeg" })))`, crear con ella → `get().imageUrl` no es `null`. `update` con otra foto borra la anterior (`ctx.storage.getUrl(vieja)` → `null`). `update({ imageId: null })` la quita. `remove` borra receta y foto. Blob `text/plain` → error "La foto debe ser una imagen de hasta 5 MB" y el archivo queda borrado.
- [ ] **Step 3:** `npx vitest run convex` → FAIL.
- [ ] **Step 4:** Implementar. Validación de foto en `create`/`update`: `const meta = await ctx.db.system.get(imageId)`; si falta, `contentType` no empieza por `image/` o `size > 5 * 1024 * 1024` → `ctx.storage.delete(imageId)` y `ConvexError("La foto debe ser una imagen de hasta 5 MB")`. El servidor aplica `normalizeTags`, filtra líneas vacías de `ingredients`/`steps`, recalcula `searchText` y `updatedAt = Date.now()`. `get` usa `ctx.db.normalizeId("recipes", id)`.
- [ ] **Step 5:** `npx vitest run` → todo PASS. `npm run typecheck` → sin errores.
- [ ] **Step 6:** Commit `feat: backend Convex de recetas con auth y fotos`.

---

### Task 5: Autenticación, providers y ruteo

**Files:**
- Create: `src/providers.tsx`, `src/router.tsx`, `src/components/Layout.tsx`, `src/pages/SignInPage.tsx`, `src/pages/SignUpPage.tsx`, `src/pages/NotFound.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: rutas (con `createBrowserRouter`, necesario para `useBlocker` en la Task 7):
  `/sign-in/*`, `/sign-up/*` (públicas); bajo `RequireAuth` + `Layout`: `/`, `/receta/nueva`, `/receta/:id`, `/receta/:id/editar`, `/receta/:id/cocinar`; `*` → `NotFound`.
  Las Tasks 6–9 crean las páginas; mientras tanto, usar componentes placeholder.

- [ ] **Step 1: Pausa con el usuario.** Pedirle que cree la app de Clerk (instancia de desarrollo) y que, en Clerk: (a) cree la plantilla JWT llamada `convex`; (b) active el modo de registro **Restricted**; (c) deje solo los métodos de login que quiera (correo y/o Google). Después pedirle la *publishable key* (va a `.env.local` como `VITE_CLERK_PUBLISHABLE_KEY`) y el *Issuer URL*. Ejecutar `npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer>`.
- [ ] **Step 2:** `providers.tsx`: `ClerkProvider` (`@clerk/react`, `publishableKey` de `import.meta.env`, `localization` en español si la versión lo ofrece) envolviendo `ConvexProviderWithClerk` (`convex/react-clerk`, `useAuth` de `@clerk/react`). `RequireAuth`: `AuthLoading` → spinner; `Unauthenticated` → `<Navigate to="/sign-in" />`; `Authenticated` → `<Outlet />`. `SignInPage` usa `<SignIn routing="path" path="/sign-in" signUpUrl={undefined} />` (sin enlace de registro); `SignUpPage` usa `<SignUp routing="path" path="/sign-up" />` (solo lo alcanzan las invitaciones). `Layout`: barra superior con "Recetario" y `<UserButton />`.
- [ ] **Step 3: Estilo.** Invocar la skill `frontend-design` para definir paleta, tipografía y componentes base (cálido, legible, botones táctiles ≥ 44 px, móvil primero) y aplicarlos en `index.css` como tokens de Tailwind.
- [ ] **Step 4: Verificar** en el navegador (`npm run dev` + `npx convex dev` en paralelo): sin sesión, `/` redirige a `/sign-in`; tras entrar, se ve el Layout con el avatar; la pantalla de login no ofrece "crear cuenta". `npm run build` → OK.
- [ ] **Step 5:** Commit `feat: autenticación con Clerk y ruteo`.

---

### Task 6: Lista de recetas

**Files:**
- Create: `src/pages/RecipeListPage.tsx`, `src/components/RecipeCard.tsx`

**Interfaces:**
- Consumes: `api.recipes.list`, `api.recipes.search`, `api.recipes.tags`, `formatMinutes`.

- [ ] **Step 1:** Implementar: buscador (con un retardo de ~250 ms; si la consulta tiene texto → `search`, si no → `list`), chips de etiquetas de `tags()` (una activa a la vez, tocar otra vez la desactiva), interruptor "Favoritas", cuadrícula de `RecipeCard` (foto o placeholder, título, `formatMinutes(prep + cook)`, estrella si es favorita) con enlace a `/receta/:id`. Botón flotante "Nueva receta" → `/receta/nueva`. Estados: cargando; vacío sin recetas ("Aún no tienes recetas. ¡Agrega la primera!"); sin resultados ("No encontramos recetas con «{texto}»").
- [ ] **Step 2: Verificar** en el navegador con 3 recetas creadas desde el panel de Convex o la Task 7: búsqueda por ingrediente, filtro por etiqueta y por favoritas, estado vacío. Revisar en 375 px de ancho.
- [ ] **Step 3:** Commit `feat: lista de recetas con búsqueda y filtros`.

---

### Task 7: Editor de recetas y fotos

**Files:**
- Create: `src/pages/RecipeEditorPage.tsx`, `src/components/TagInput.tsx`, `src/components/ConfirmDialog.tsx`, `src/lib/image.ts`
- Test: `src/lib/image.test.ts`

**Interfaces:**
- Consumes: `RecipeFormValues`, `emptyForm`, `recipeToForm`, `formToInput`, `normalizeIngredients`, `normalizeSteps`; `api.recipes.get/create/update/tags`, `api.files.generateUploadUrl`.
- Produces:
  ```ts
  export function fitWithin(w: number, h: number, max: number): { width: number; height: number };
  export async function resizeImage(file: File, maxSide = 1600, quality = 0.8): Promise<Blob>; // image/webp; si el navegador no lo genera, image/jpeg
  export function ConfirmDialog(props: { open: boolean; title: string; message: string; confirmLabel: string; onConfirm(): void; onCancel(): void }): JSX.Element;
  ```

- [ ] **Step 1: Escribir las pruebas que fallan:** `fitWithin(4000, 3000, 1600)` → `{width:1600,height:1200}`; `fitWithin(3000, 4000, 1600)` → `{width:1200,height:1600}`; `fitWithin(800, 600, 1600)` → `{width:800,height:600}`.
- [ ] **Step 2:** `npx vitest run src/lib/image.test.ts` → FAIL; implementar `fitWithin`; → PASS.
- [ ] **Step 3:** Implementar `resizeImage` (`createImageBitmap` + `canvas.toBlob`). Si falla la decodificación → error "No se pudo leer la imagen".
- [ ] **Step 4:** Implementar el editor según spec §6.5 (5). Detalles:
  - El texto de ingredientes y pasos se convierte con `normalizeIngredients`/`normalizeSteps` dentro de `formToInput` al guardar.
  - La foto elegida se previsualiza (object URL) pero **se sube solo al guardar**: `resizeImage` → `generateUploadUrl` → `fetch(url, { method: "POST", headers: { "Content-Type": blob.type }, body: blob })` → `storageId`. Así cancelar no deja archivos huérfanos. "Quitar foto" en una receta existente envía `imageId: null`.
  - `TagInput`: chips + campo con sugerencias de `tags()`; Enter o coma añade la etiqueta.
  - Errores de `formToInput` se muestran bajo cada campo; errores de Convex (`ConvexError`) arriba del formulario.
  - Cambios sin guardar: `useBlocker(isDirty && !saving)` → `ConfirmDialog` ("¿Salir sin guardar?"); además `beforeunload`.
  - Al guardar → navegar a `/receta/:id`. En `/receta/:id/editar` con `get` → `null` → `NotFound`.
- [ ] **Step 5: Verificar** en el navegador: crear una receta pegando ingredientes con viñetas y pasos numerados, y comprobar que se guardan limpios; subir una foto del móvil (> 5 MB original) y ver que se guarda; editar y quitar la foto; intentar salir con cambios → aparece el aviso.
- [ ] **Step 6:** Commit `feat: editor de recetas con fotos`.

---

### Task 8: Detalle de receta

**Files:**
- Create: `src/pages/RecipeDetailPage.tsx`, `src/components/ServingsStepper.tsx`
- Test: `src/components/ServingsStepper.test.tsx`

**Interfaces:**
- Consumes: `api.recipes.get/toggleFavorite/remove`, `scaleIngredient`, `isSectionHeader`, `formatMinutes`, `ConfirmDialog`.
- Produces: `ServingsStepper(props: { value: number; onChange(n: number): void })` (mínimo 1). Enlace a modo cocina: `/receta/:id/cocinar?porciones=N`.

- [ ] **Step 1: Escribir la prueba que falla:** con `value={1}`, el botón "−" está deshabilitado; al pulsar "+" llama `onChange(2)`.
- [ ] **Step 2:** FAIL → implementar `ServingsStepper` → PASS.
- [ ] **Step 3:** Implementar la página: `get` → `undefined` (cargando) / `null` ("Receta no encontrada" con enlace a la lista) / receta. Muestra foto, título, descripción, tiempos (preparación, cocción, total), etiquetas, ingredientes, pasos y notas. Factor = porciones elegidas / `servings`; sin `servings` no aparece el `ServingsStepper`. Subtítulos de sección (`isSectionHeader`) en negrita y sin casilla. Pasos numerados. `sourceUrl` como enlace con `target="_blank" rel="noopener noreferrer"`, y solo si `isHttpUrl`. Acciones: favorita, editar, borrar (`ConfirmDialog` → `remove` → navegar a `/`), "Empezar a cocinar". En pantallas ≥ 1024 px, ingredientes y pasos en dos columnas.
- [ ] **Step 4: Verificar** en el navegador: cambiar de 4 a 2 porciones recalcula "500 g" → "250 g"; receta sin porciones no muestra el selector; `/receta/xyz` muestra "Receta no encontrada".
- [ ] **Step 5:** Commit `feat: detalle de receta con ajuste de porciones`.

---

### Task 9: Modo cocina

**Files:**
- Create: `src/hooks/useWakeLock.ts`, `src/hooks/cooking.ts`, `src/pages/CookingPage.tsx`
- Test: `src/hooks/useWakeLock.test.ts`, `src/hooks/cooking.test.ts`

**Interfaces:**
- Consumes: `api.recipes.get`, `parseServingsParam`, `scaleIngredient`, `isSectionHeader`.
- Produces:
  ```ts
  export type CookingState = { checked: number[]; current: number };
  export type CookingAction = { type: "toggle"; index: number } | { type: "next"; stepCount: number } | { type: "prev" } | { type: "goto"; index: number; stepCount: number };
  export function cookingReducer(s: CookingState, a: CookingAction): CookingState;
  export function useWakeLock(active: boolean): { supported: boolean; locked: boolean };
  ```

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `cookingReducer`: `toggle` 2 añade y quita el 2 de `checked`; `next` en el último paso no avanza (`current` = `stepCount − 1`); `prev` en 0 se queda en 0; `goto` fuera de rango se acota.
  - `useWakeLock` (con `renderHook` y un `navigator.wakeLock.request` simulado que devuelve un sentinel con `release` y eventos): con `active=true` pide el lock y `locked` pasa a `true`; al desmontar llama `release`; si el sentinel emite `release` y luego `document.visibilityState` pasa a `"visible"` con evento `visibilitychange`, **vuelve a pedirlo** (2 llamadas a `request`); sin `navigator.wakeLock` → `{ supported: false, locked: false }` sin lanzar errores; si `request` rechaza, `locked` sigue `false` sin error sin capturar.
- [ ] **Step 2:** `npx vitest run src/hooks` → FAIL.
- [ ] **Step 3:** Implementar los hooks. Implementar `CookingPage` según spec §6.5 (4): porciones desde `parseServingsParam(searchParams.get("porciones"), recipe.servings)`; letra base ≥ 20 px; casillas en ingredientes (no en subtítulos); paso actual resaltado y pasos anteriores en gris; botones "Anterior"/"Siguiente" grandes y fijos abajo; tocar un paso lo hace actual; flecha "←" vuelve al detalle. Si `!supported`, nota discreta: "Tu navegador no puede mantener la pantalla encendida". El estado es local (`useReducer`) y no se guarda.
- [ ] **Step 4:** `npx vitest run` → PASS. **Verificar** en el navegador del móvil o en el emulador de 375 px: marcar ingredientes, avanzar pasos; con `?porciones=2` las cantidades se escalan.
- [ ] **Step 5:** Commit `feat: modo cocina con pantalla encendida`.

---

### Task 10: PWA

**Files:**
- Create: `public/logo.svg`, `pwa-assets.config.ts`, `src/components/UpdatePrompt.tsx`
- Modify: `vite.config.ts`, `index.html`, `src/components/Layout.tsx`

- [ ] **Step 1:** Logo SVG simple y cálido (por ejemplo, una olla o un libro de recetas) en `public/logo.svg`. Generar iconos con `@vite-pwa/assets-generator` (preset `minimal-2023`), conectado vía `pwaAssets` en el plugin.
- [ ] **Step 2:** `VitePWA({ registerType: "prompt", manifest: { name: "Recetario", short_name: "Recetario", lang: "es", start_url: "/", display: "standalone", theme_color, background_color }, workbox: { globPatterns: ["**/*.{js,css,html,svg,png,ico,webp}"], navigateFallback: "/index.html" } })` con los colores de la Task 5. **Sin `runtimeCaching`**.
- [ ] **Step 3:** `UpdatePrompt` con `useRegisterSW` de `virtual:pwa-register/react`: barra "Hay una nueva versión" con botón "Actualizar" (`updateServiceWorker(true)`). Montarlo en `Layout`.
- [ ] **Step 4: Verificar:** `npm run build` → existen `dist/manifest.webmanifest` y `dist/sw.js`; `npm run preview` → en DevTools › Application, el manifest es válido e instalable y el service worker está activo; en Network, las peticiones a Convex no salen del service worker.
- [ ] **Step 5:** Commit `feat: PWA instalable`.

---

### Task 11: Despliegue y README

**Files:**
- Create: `vercel.json`, `README.md`

- [ ] **Step 1:** `vercel.json`: `{ "buildCommand": "npx convex deploy --cmd 'npm run build'", "outputDirectory": "dist", "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
- [ ] **Step 2:** `README.md` en español con: requisitos; desarrollo local (`npx convex dev` + `npm run dev`, `.env.local`); configuración de Clerk (plantilla `convex`, modo Restricted, invitar personas desde *Users › Invite*); **Etapa 1** (Vercel con `*.vercel.app` y Clerk de desarrollo: importar el repo, variables `CONVEX_DEPLOY_KEY` de producción y `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_JWT_ISSUER_DOMAIN` en Convex producción); **Etapa 2** (`recetas.edpelaez.com`: dominio en Vercel, CNAME `recetas` en Namecheap › Advanced DNS hacia el destino que indique Vercel, instancia de producción de Clerk con los CNAME que pida, actualizar la clave pública en Vercel y el issuer en Convex, volver a desplegar); nota sobre la versión de TypeScript si se bajó.
- [ ] **Step 3: Pausa con el usuario** para la Etapa 1: el usuario crea el proyecto en Vercel y copia las claves (el agente no crea cuentas ni escribe claves). Después de desplegar, verificar en la URL `*.vercel.app`: login, crear receta con foto, modo cocina, instalar en el móvil y recargar una ruta profunda (`/receta/:id`) sin 404.
- [ ] **Step 4:** `npm test` y `npm run build` → PASS. Commit `docs: README y configuración de despliegue`.
