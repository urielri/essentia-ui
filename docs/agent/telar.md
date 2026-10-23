# Telar (`@repo/telar`) y apps Next (`apps/telar`, `apps/docs`)

Leé esta guía antes de tocar `packages/telar`, `apps/telar` o `apps/docs`. Telar es independiente del stack Essentia: es una librería React y no comparte capas ni reglas GPU con él. El modelo y la API están en la documentación del paquete:

- [`README.md`](../../packages/telar/README.md): API pública y casos de uso;
- [`CONCEPT.md`](../../packages/telar/CONCEPT.md): visión y problema que resuelve;
- [`CORE.md`](../../packages/telar/CORE.md), [`GRAPH.md`](../../packages/telar/GRAPH.md), [`DEEP_DIVE.md`](../../packages/telar/DEEP_DIVE.md): internals del núcleo y del grafo;
- [`IMPLEMENTATION_GUIDE.md`](../../packages/telar/IMPLEMENTATION_GUIDE.md): cómo integrarlo en una app.

## Estructura de `@repo/telar`

| Ruta                       | Qué va                                                                  | Entry point                  |
| -------------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| `src/core/`                | Primitivas (`knot`, `thread`, `bind`), grafo y store. Sin React         | `@repo/telar`                |
| `src/react/`               | Proveedores (`TelarRoot`, `TelarRootProvider`) y hooks (`useKnot`…)     | `@repo/telar/react`          |
| `src/server/`              | Prefetch para React Server Components                                   | `@repo/telar/server`         |
| `src/worker/`              | Persistencia MPA con Worker                                             | `@repo/telar/worker`         |
| `src/__tests__/`           | Tests de Vitest (jsdom)                                                 | —                            |

- **`src/core/` no importa React.** Lo que depende de React va en `src/react/`.
- **Un entry point nuevo** se declara en `exports` del `package.json` y tiene su archivo en la raíz del paquete (`react.ts`, `server.ts`). Es un cambio de API: proponelo antes.
- **Las tres primitivas** (`knot`, `thread`, `bind`) son la API base. Una primitiva nueva es una decisión de diseño, no un detalle de implementación.

## Convenciones propias

Telar sigue [`code.md`](./code.md) salvo en esto:

- **Nombres de archivo:** componentes React en PascalCase (`TelarRoot.tsx`) y hooks en camelCase (`useKnot.ts`). El resto del núcleo en minúscula (`knot.ts`, `graph.ts`).
- **Imports relativos sin extensión** (`from '../core/knot'`).
- **Tests en `src/__tests__/`**, no junto al módulo: la config de Vitest solo toma `src/__tests__/**/*.{test,spec}.{ts,tsx}`. Los hooks se prueban con `renderHook` de `@testing-library/react` dentro de un `TelarRoot`.
- **Secciones** separadas con comentarios de regla (`// ─── knot ───…`), como en los tests y en `apps/telar/state/`.
- **`any` heredado:** hay usos en `useBind`, `useDispatch` y `useTelar`. No los corrijas de paso; en código nuevo, `any` solo con un comentario que lo justifique.

## Documentación del paquete = contenido de `apps/telar`

`apps/telar` lee los `.md` de `packages/telar` en runtime (`TELAR_DOCS_DIR`, definido en `next.config.mjs`) y los muestra en `/docs`. Por eso:

- **No renombres ni muevas** `README.md`, `CORE.md`, `DEEP_DIVE.md`, `GRAPH.md` ni `IMPLEMENTATION_GUIDE.md` sin actualizar las páginas de `apps/telar/app/docs/`.
- **Cuando cambia la API,** actualizá esos documentos en el mismo PR: son la documentación publicada.

## `apps/telar` y `apps/docs`

- **Next.js 15 con App Router.** `apps/telar` agrupa las demos (`todo`, `squares`, `profile-demo`, `worker-demo`…) y la documentación de Telar. El estado de cada demo vive en `apps/telar/state/<demo>.ts`.
- **`apps/telar/env.sh`** exporta las variables de desarrollo que usa `dev:web`. No contiene secretos: no agregues ninguno ahí.
- **`apps/docs`** es la plantilla inicial de `create-next-app` y todavía no tiene contenido propio. No la tomes como referencia de convenciones.
- **Lint:** solo estas apps tienen ESLint (`next lint`). Los paquetes Essentia no.

## Verificación

- `npm run test --workspace=@repo/telar` (corre con cobertura v8).
- Si cambió algo que usan las demos, `npm run dev --workspace=telar` y revisá la demo afectada y `/docs`.
