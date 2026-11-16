# Recetario

Recetario personal en la nube: guarda y organiza tus recetas y consúltalas mientras cocinas, desde cualquier dispositivo. Es una PWA (se instala en el móvil como una app).

- **Frontend:** Vite + React 19 + Tailwind 4 (TypeScript 7)
- **Datos y backend:** [Convex](https://convex.dev)
- **Inicio de sesión:** [Clerk](https://clerk.com), **solo por invitación**
- **Hosting:** [Vercel](https://vercel.com)

Diseño: [`docs/superpowers/specs/2026-11-16-recetario-design.md`](docs/superpowers/specs/2026-11-16-recetario-design.md)

## Funciones

- Recetas privadas con foto, porciones, tiempos, ingredientes, pasos, etiquetas, notas y enlace de origen.
- Ingredientes en texto libre (uno por línea). La app detecta la cantidad al inicio de cada línea (`500 g`, `1 1/2`, `½`, `0,5`, `2-3`, `2 a 3`) para **ajustar porciones**. Una línea que termina en `:` es un subtítulo («Para la salsa:»).
- Pegar desde una web: se quitan viñetas y numeración; una línea en blanco separa pasos largos.
- Búsqueda por nombre o ingrediente, filtro por etiqueta y favoritas.
- **Modo cocina:** letra grande, casillas para ingredientes, paso actual resaltado y pantalla siempre encendida (Wake Lock).

## Desarrollo local

Requisitos: Node 22+ y una cuenta de Clerk.

```bash
npm install
npx convex dev          # en una terminal: crea/usa el despliegue de desarrollo y genera tipos
npm run dev             # en otra terminal: http://localhost:5173
```

`.env.local` (no se sube al repo; ver `.env.example`):

```
VITE_CONVEX_URL=...                  # lo escribe `npx convex dev`
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

En Convex (una vez por despliegue):

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<tu-instancia>.clerk.accounts.dev
```

Pruebas y verificación:

```bash
npm test          # Vitest: lógica pura, hooks y funciones de Convex (convex-test)
npm run typecheck
npm run build
```

## Configurar Clerk

1. Crea una aplicación en [dashboard.clerk.com](https://dashboard.clerk.com) y elige los métodos de acceso (correo, Google…).
2. **Configure → JWT templates → New template → Convex**. El nombre debe ser exactamente `convex`. Copia su **Issuer**.
3. **Configure → Access mode → Invite-only.** Nadie puede registrarse por su cuenta.
4. Para dar acceso a alguien: **Users → Invite**. La persona recibe un correo y crea su cuenta desde el enlace.

## Despliegue

### Etapa 1 — `*.vercel.app` con Clerk de desarrollo

1. En Convex, crea el despliegue de **producción** (Dashboard → tu proyecto → *Production*) y define ahí `CLERK_JWT_ISSUER_DOMAIN` con el Issuer de Clerk.
2. En Convex → *Production → Settings → Deploy keys*, genera una **Production deploy key**.
3. En Vercel → *Add New → Project*, importa este repositorio (Vercel detecta Vite; `vercel.json` ya define el build).
4. Variables de entorno en Vercel (*Production*):
   - `CONVEX_DEPLOY_KEY` = la deploy key del paso 2
   - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_test_…`
   (`VITE_CONVEX_URL` la inyecta `npx convex deploy` durante el build.)
   - **Despliegues de vista previa (Preview):** Vercel construye cada rama que no es `main` (como `feat/recetario-v1`) con las variables de *Preview*. Sin `CONVEX_DEPLOY_KEY` ahí, esos builds fallan. Elige una opción: en Convex genera una **Preview deploy key** y ponla como `CONVEX_DEPLOY_KEY` solo en *Preview* (cada vista previa tendrá su propio backend temporal), o desactiva las vistas previas en *Settings → Git*. Para la primera vez, lo más simple es fusionar `feat/recetario-v1` en `main` y desplegar desde `main`.
5. Despliega. El build ejecuta `npx convex deploy --cmd 'npm run build'`: publica las funciones de Convex y compila el frontend.
6. Comprueba: login, crear una receta con foto, modo cocina, instalar en el móvil y recargar una ruta como `/receta/<id>` sin error 404.

> La instancia de desarrollo de Clerk funciona, pero tiene límites de uso y muestra «Development mode» en el login.

### Etapa 2 — dominio `recetas.edpelaez.com`

1. **Vercel → Project → Settings → Domains → Add** `recetas.edpelaez.com`. Vercel te dirá el destino del CNAME (por ejemplo `cname.vercel-dns.com`).
2. **Namecheap → Domain List → edpelaez.com → Advanced DNS → Add new record:**
   - Tipo `CNAME`, Host `recetas`, Value = el destino que indicó Vercel.
3. **Clerk → crea la instancia de producción** (selector de instancia → *Production*) con el dominio `recetas.edpelaez.com`. Clerk mostrará varios registros CNAME (por ejemplo `clerk.recetas`, `accounts.recetas` y los de correo). Añádelos igual en Namecheap → Advanced DNS y espera a que Clerk los marque como verificados.
4. En la instancia de producción de Clerk, repite: plantilla JWT `convex`, *Access mode → Invite-only* y los métodos de acceso. Si usas Google, configura tus propias credenciales OAuth (Clerk lo pide en producción).
5. Actualiza las claves:
   - Vercel: `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_…`
   - Convex (producción): `CLERK_JWT_ISSUER_DOMAIN` = el Issuer de la instancia de producción (por ejemplo `https://clerk.recetas.edpelaez.com`).
6. Vuelve a desplegar en Vercel e invita de nuevo a los usuarios (las cuentas de desarrollo no pasan a producción).

## Estructura

```
convex/            backend: esquema, funciones de recetas y archivos, pruebas
  lib/recipeText.ts  funciones puras compartidas con el cliente
src/lib/           lógica pura: cantidades, normalización, formulario, imágenes
src/hooks/         modo cocina y Wake Lock
src/pages/         pantallas
src/components/    componentes compartidos
```
