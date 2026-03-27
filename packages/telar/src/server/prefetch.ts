import type { KnotDef } from '../core/types'

/**
 * KnotDef extendido con soporte para inicialización server-side.
 * La función `server` se ejecuta en el servidor (RSC / Server Component).
 * `sanitize` permite filtrar datos sensibles antes de enviar al cliente.
 */
export type ServerKnotDef<T> = KnotDef<T> & {
  server?: (ctx: ServerContext) => Promise<T>
  sanitize?: (value: T) => T
}

export type ServerContext = Record<string, unknown>

/**
 * Cache de valores prefetcheados por request.
 * En RSC (Next.js App Router), cada request tiene su propio scope de módulo,
 * por lo que este Map es efectivamente per-request.
 *
 * Para entornos fuera de RSC, usar `createServerCache()` explícitamente.
 */
const globalServerCache = new Map<string, unknown>()

export function getServerCache(): ReadonlyMap<string, unknown> {
  return globalServerCache
}

export function clearServerCache(): void {
  globalServerCache.clear()
}

/**
 * Ejecuta la función `server` del knot, aplica `sanitize` si existe,
 * y almacena el resultado en el cache del servidor.
 *
 * Uso en Server Components (Next.js App Router):
 * ```tsx
 * export default async function Page() {
 *   await prefetchKnot(userKnot)
 *   return <TelarRoot><App /></TelarRoot>
 * }
 * ```
 */
export async function prefetchKnot<T>(def: ServerKnotDef<T>): Promise<void> {
  if (!def.server) return

  const value = await def.server({})
  const sanitized = def.sanitize ? def.sanitize(value) : value

  globalServerCache.set(def.key, sanitized)
}
