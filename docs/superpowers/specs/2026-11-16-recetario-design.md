# Recetario — Documento de diseño

Fecha: 2026-11-16
Estado: borrador, pendiente de aprobación

## 1. Intención

Un recetario personal en la nube. El usuario quiere **guardar y organizar sus recetas** y **consultarlas mientras cocina**, desde cualquier dispositivo (móvil, tablet, ordenador), viendo siempre los mismos datos. Se instala como PWA para usarla como una app en el móvil.

## 2. Objetivos, no-objetivos y anti-objetivos

**Objetivos**
- Crear, editar, borrar y consultar recetas con ingredientes y procedimiento.
- Organizar con etiquetas y encontrar rápido (búsqueda por nombre o ingrediente).
- Una vista para cocinar cómoda: letra grande, marcar pasos, pantalla encendida.
- Ajustar porciones y que se recalculen las cantidades de los ingredientes.
- Sincronización en la nube por usuario (Convex), con login (Clerk).
- Instalable como PWA, desplegada en Vercel.

**No-objetivos (por ahora)**
- Uso sin conexión ni caché de datos (se puede pensar más adelante; la arquitectura no debe impedirlo).
- Compartir recetas con otras personas o hacerlas públicas.
- Lista de compras, planificador de menús, información nutricional.
- Importar recetas desde una URL.

**Anti-objetivos (sería un fracaso aunque funcione)**
- Que capturar una receta sea lento o tedioso (formularios con muchos campos por ingrediente).
- Que leer la receta mientras se cocina sea incómodo (letra chica, pantalla que se apaga, mucho scroll entre ingredientes y pasos).
- Que un usuario pueda ver o modificar recetas de otro.
- Perder datos (por ejemplo, salir del editor sin aviso con cambios sin guardar).

## 3. Restricciones

- Base de datos y backend: **Convex**.
- Autenticación: **Clerk**.
- Despliegue: **Vercel**.
- Debe ser una **PWA** instalable.
- Interfaz en **español**.

## 4. Enfoques considerados

| Enfoque | Ventajas | Desventajas |
|---|---|---|
| **A) Vite + React (SPA)** ✅ elegido | Encaja con el modelo cliente-en-tiempo-real de Convex; PWA más simple con `vite-plugin-pwa`; deja la puerta abierta al modo sin conexión; Vercel lo sirve como sitio estático. | Sin renderizado en servidor (no hace falta: todo es privado detrás de login). |
| B) Next.js (App Router) | Framework nativo de Vercel, plantillas oficiales Convex + Clerk. | Piezas que no aportan aquí (server components, middleware); PWA más engorrosa. Solo valdría la pena con páginas públicas indexables. |
| Descartados: Remix, TanStack Start | — | Más complejidad sin resolver ninguna necesidad del proyecto. |

**Elegido por el usuario: A (Vite + React).**

## 5. Decisiones tomadas

### Del usuario
- Propósito: guardar/organizar recetas y consultarlas al cocinar.
- Ingredientes y procedimiento se capturan en la receta.
- Datos en la nube, accesibles desde cualquier dispositivo.
- Caché/offline: no ahora.
- Ingredientes en **texto libre, uno por línea, con detección automática de cantidad** (para escalar porciones).
- Stack: Vite + React, Convex, Clerk, Vercel.
- **Registro cerrado**: solo el usuario y unas pocas personas invitadas pueden tener cuenta.
- **Dominio de producción**: `recetas.edpelaez.com` (DNS en Namecheap; aún no configurado).

### Propuestas por el asistente (aceptadas sin objeción, revisables)
- Recetas **privadas por usuario**.
- Organización con **etiquetas libres** (no categorías fijas) + **favoritas**.
- **Foto opcional** por receta, guardada en Convex File Storage.
- **Vista "cocinando"** con letra grande, marcar ingredientes/pasos y Wake Lock.
- TypeScript, Tailwind CSS.

### Decisiones técnicas del asistente
- Versiones más recientes al 2026-11-16 (consultadas en npm; el usuario pidió usar lo último):
  | Paquete | Versión |
  |---|---|
  | react / react-dom | 19.3.1 |
  | vite | 8.3.8 |
  | @vitejs/plugin-react | 6.3.0 |
  | tailwindcss / @tailwindcss/vite | 4.3.5 |
  | convex | 1.50.0 |
  | **@clerk/react** | 6.18.8 — reemplaza a `@clerk/clerk-react`, que está deprecado; `convex/react-clerk` ya lo soporta |
  | react-router | 8.5.1 |
  | vite-plugin-pwa | 2.0.0 (compatible con Vite 8) |
  | vitest | 5.1.0 |
  | convex-test | 0.0.71 |
  | typescript | 7.0.2 (si alguna herramienta aún no es compatible, bajar a la última 6.x y anotarlo) |
- Ruteo con `react-router` (modo librería, SPA).
- Pruebas con Vitest (prioridad: el parser de ingredientes y el escalado) y `convex-test` para las funciones de Convex.

## 6. Diseño

### 6.1 Arquitectura

```
Navegador (PWA, Vite + React)
  ├─ ClerkProvider (@clerk/react)  → sesión del usuario
  └─ ConvexProviderWithClerk (convex/react-clerk) → queries/mutations en tiempo real
Convex
  ├─ auth.config.ts  → valida el JWT de Clerk (plantilla "convex")
  ├─ tabla recipes   → datos de recetas
  └─ File Storage    → fotos
Vercel → sirve el build estático (con rewrite de SPA a index.html)
```

Toda query/mutation de Convex obtiene la identidad con `ctx.auth.getUserIdentity()` y filtra/valida por `userId = identity.tokenIdentifier`. Sin identidad → error. Nunca se acepta `userId` desde el cliente.

### 6.2 Modelo de datos (Convex)

Tabla `recipes`:

| Campo | Tipo | Notas |
|---|---|---|
| `userId` | string | `tokenIdentifier` de Clerk |
| `title` | string | obligatorio |
| `description` | string? | breve |
| `imageId` | Id<"_storage">? | foto opcional |
| `servings` | number? | porciones base (para escalar) |
| `prepMinutes` | number? | |
| `cookMinutes` | number? | |
| `ingredients` | string[] | una línea por ingrediente, texto tal cual lo escribió el usuario. Una línea que termina en `:` es un subtítulo de sección (p. ej. "Para la salsa:") |
| `steps` | string[] | un paso por elemento |
| `tags` | string[] | normalizadas a minúsculas, sin espacios sobrantes, sin duplicados |
| `notes` | string? | |
| `sourceUrl` | string? | de dónde salió la receta |
| `favorite` | boolean | |
| `searchText` | string | derivado en servidor: título + ingredientes + etiquetas, para la búsqueda |
| `updatedAt` | number | |

Índices:
- `by_user_updated` en `["userId", "updatedAt"]` — listado principal.
- Índice de búsqueda `search_text` sobre `searchText` con `filterFields: ["userId"]`.

Las etiquetas existentes del usuario se obtienen agregando las de sus recetas (volumen personal, es suficiente; no hace falta tabla aparte).

Los ingredientes se guardan **solo como texto**; la detección de cantidad ocurre en el cliente al mostrar (función pura). Así el usuario nunca pierde lo que escribió y el parser se puede mejorar sin migrar datos.

### 6.3 Funciones de Convex

- `recipes.list({ tag?, favoritesOnly? })` — recetas del usuario, más recientes primero.
- `recipes.search({ query, tag? })` — usa el índice de búsqueda.
- `recipes.get({ id })` — devuelve la receta + URL de la imagen; error si no es del usuario.
- `recipes.tags()` — etiquetas únicas del usuario con conteo.
- `recipes.create(data)` / `recipes.update({ id, ...data })` — validan propiedad, normalizan etiquetas, recalculan `searchText` y `updatedAt`; al reemplazar la foto se borra la anterior del storage.
- `recipes.remove({ id })` — borra la receta y su foto.
- `recipes.toggleFavorite({ id })`.
- `files.generateUploadUrl()` — requiere sesión.

### 6.4 Detección de cantidades y escalado

Función pura `parseIngredient(line) → { quantity?: number | [number, number], rest: string, raw: string }` y `scaleIngredient(line, factor) → string`.

Debe reconocer al **inicio** de la línea:
- enteros y decimales con punto o coma: `500`, `0,5`, `1.5`
- fracciones: `1/2`, `1 1/2`, y caracteres unicode `½ ¼ ¾ ⅓ ⅔`
- rangos: `2-3`, `2 a 3`
- (opcional, si sale fácil) palabras: `un`, `una`, `medio`, `media`

Reglas:
- Solo se escala la cantidad; la unidad y el resto del texto quedan igual.
- Líneas sin cantidad ("sal al gusto") y subtítulos de sección no se tocan.
- Formato del resultado: fracciones comunes (¼, ⅓, ½, ⅔, ¾) cuando el valor está muy cerca de una; si no, como mucho 1–2 decimales con coma decimal; enteros sin decimales.
- Factor = porciones elegidas / `servings`. Si la receta no tiene `servings`, el control de porciones no aparece.

Esta es la parte con más casos borde: cubrirla bien con pruebas unitarias.

### 6.5 Pantallas

1. **Entrada / login** — componente `SignIn` de Clerk con estilo acorde; usuario sin sesión siempre redirigido aquí. No hay pantalla de registro pública: las cuentas se crean por invitación desde el panel de Clerk (ver 6.8). Las personas invitadas completan su registro desde el enlace del correo, que Clerk resuelve con su propio flujo de aceptación de invitación (ruta `/sign-up` solo para ese caso).
2. **Mis recetas** (`/`) — buscador arriba, chips de etiquetas para filtrar, filtro de favoritas, tarjetas con foto (o placeholder), título y tiempo total. Botón flotante "Nueva receta". Estado vacío amigable para el primer uso.
3. **Detalle** (`/receta/:id`) — foto, título, tiempos, etiquetas, selector de porciones (− / +), ingredientes (escalados), pasos numerados, notas, fuente. Acciones: editar, favorita, borrar (con confirmación), "Empezar a cocinar".
4. **Modo cocina** (`/receta/:id/cocinar`) — letra grande, ingredientes con casilla para marcar, pasos con el paso actual destacado y avance; pide Wake Lock (`navigator.wakeLock`) y lo libera al salir; si el navegador no lo soporta, sigue funcionando sin él. El estado de las casillas es local (no se guarda en Convex).
5. **Editor** (`/receta/nueva`, `/receta/:id/editar`) — título, foto (subir/cambiar/quitar), porciones, tiempos, **un área de texto para ingredientes (uno por línea)** y **otra para pasos (uno por línea; líneas vacías se ignoran)**, etiquetas con autocompletado de las existentes, notas, URL de origen. Aviso si se sale con cambios sin guardar.

   **Pegado desde la web** *(decisión del asistente)*: el usuario pega los ingredientes en su área y los pasos en la suya (no se intenta separar una receta completa pegada en un solo lugar). Al guardar se normaliza cada lista con una función pura probada:
   - Ingredientes: se quitan viñetas al inicio (`•`, `-`, `*`, `·`, `–`) seguidas de espacio, y espacios sobrantes; se descartan líneas vacías. (La viñeta se quita *antes* de detectar cantidades, así `- 2-3 huevos` queda `2-3 huevos`.)
   - Pasos: se quitan viñetas y numeración al inicio (`1.`, `1)`, `Paso 1:`, `Paso 1.`). Separación de pasos: si el texto contiene líneas vacías, cada bloque separado por líneas vacías es un paso (sus líneas internas se unen con espacio); si no hay líneas vacías, cada línea es un paso.

Diseño responsive pensado primero para móvil; en escritorio, el detalle puede mostrar ingredientes y pasos lado a lado.

### 6.6 Fotos

- Se reducen en el cliente antes de subir (lado mayor ~1600 px, JPEG/WebP calidad ~0.8) para no gastar almacenamiento ni datos.
- Subida con `generateUploadUrl` → `POST` → guardar `storageId` en la receta.
- Protección ligera (el registro es cerrado): al asociar la foto, el servidor verifica con `ctx.storage.getMetadata` que sea una imagen de ≤ 5 MB; si no, la borra y devuelve error.

### 6.7 PWA

- `vite-plugin-pwa` con `registerType: "prompt"` (aviso "Hay una nueva versión, actualizar").
- Manifest en español: nombre "Recetario", `display: standalone`, colores de tema, iconos 192/512 + maskable.
- El service worker precachea **solo el app shell** (HTML/JS/CSS/iconos). No cachea datos de Convex (no-objetivo actual).

### 6.8 Configuración y despliegue

- Clerk: aplicación con plantilla JWT llamada `convex`; `CLERK_JWT_ISSUER_DOMAIN` como variable de entorno en Convex.
- Cliente: `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`.
- Vercel: build command `npx convex deploy --cmd 'npm run build'`, con `CONVEX_DEPLOY_KEY` (producción) en Vercel; `vercel.json` con rewrite de todas las rutas a `/index.html`.
- **Acceso restringido en Clerk**: modo de registro "Restricted" (solo por invitación), y se desactivan los proveedores no deseados. Las invitaciones se envían desde el panel de Clerk.
- **Despliegue en dos etapas:**
  1. *Primero*: Vercel en `*.vercel.app` con la instancia **de desarrollo** de Clerk, para tener la app funcionando ya.
  2. *Después*: dominio `recetas.edpelaez.com` → en Namecheap, registro CNAME `recetas` → destino que indique Vercel; crear la instancia **de producción** de Clerk para ese dominio y añadir en Namecheap los CNAME que Clerk pida (p. ej. `clerk.recetas`, `accounts.recetas` y los de correo); actualizar `VITE_CLERK_PUBLISHABLE_KEY` en Vercel y `CLERK_JWT_ISSUER_DOMAIN` en Convex producción con los valores de la instancia de producción.
- README con los pasos de configuración de ambas etapas (crear apps en Clerk y Convex, variables, DNS en Namecheap, despliegue).

## 7. Lo que queda a criterio del constructor

- Estilo visual concreto (paleta, tipografía, componentes); debe ser cálido, legible y cómodo con las manos ocupadas (botones grandes).
- Librería de iconos y de componentes, si se usa alguna.
- Detalles internos del parser, mientras cumpla las reglas de 6.4.
- Estructura de carpetas del proyecto.

## 8. Ubicación

Proyecto en `C:\Users\edgar\Documents\personal\recetario`. Este documento se incluirá en el primer commit cuando se inicialice el repositorio.
