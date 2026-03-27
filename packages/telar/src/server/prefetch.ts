import type { KnotDef } from '../core/types'

// ─── Tipos públicos ───────────────────────────────────────────────────────────

/**
 * KnotDef extendido con soporte para inicialización server-side.
 * La función `server` se ejecuta en el servidor antes del primer render.
 * `sanitize` permite filtrar datos sensibles antes de serializar al cliente.
 */
export type ServerKnotDef<T> = KnotDef<T> & {
  server?: (ctx: ServerContext) => Promise<T>
  sanitize?: (value: T) => T
}

export type ServerContext = Record<string, unknown>

export type PrefetchContext = {
  <T>(def: ServerKnotDef<T>): Promise<void>
  /** Retorna los valores prefetcheados como objeto serializable */
  flush: () => Record<string, unknown>
}

// ─── createPrefetchContext ────────────────────────────────────────────────────

/**
 * Crea un contexto de prefetch aislado. Es la única API para inicializar
 * knots desde el servidor, y funciona de forma idéntica en dos entornos:
 *
 * **React Server Components (Next.js App Router)**
 * ```tsx
 * export default async function Page() {
 *   const prefetch = createPrefetchContext()
 *
 *   await prefetch(userKnot)
 *   await prefetch(cartKnot)
 *
 *   return (
 *     <TelarRoot initialValues={prefetch.flush()}>
 *       <App />
 *     </TelarRoot>
 *   )
 * }
 * ```
 *
 * **SSR tradicional con getServerSideProps**
 * ```typescript
 * export async function getServerSideProps(ctx) {
 *   const prefetch = createPrefetchContext(ctx)
 *
 *   await prefetch(userKnot)
 *   await prefetch(cartKnot)
 *
 *   return { props: { initialValues: prefetch.flush() } }
 * }
 *
 * export default function Page({ initialValues }) {
 *   return (
 *     <TelarRoot initialValues={initialValues}>
 *       <App />
 *     </TelarRoot>
 *   )
 * }
 * ```
 *
 * El cache es local a cada llamada de `createPrefetchContext`, por lo que
 * múltiples requests concurrentes nunca se interfieren entre sí.
 */
export function createPrefetchContext(ctx: ServerContext = {}): PrefetchContext {
  const cache = new Map<string, unknown>()

  async function prefetch<T>(def: ServerKnotDef<T>): Promise<void> {
    if (!def.server) return
    const value     = await def.server(ctx)
    const sanitized = def.sanitize ? def.sanitize(value) : value
    cache.set(def.key, sanitized)
  }

  prefetch.flush = (): Record<string, unknown> => Object.fromEntries(cache)

  return prefetch as PrefetchContext
}
