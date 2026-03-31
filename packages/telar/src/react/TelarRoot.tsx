import type { ReactNode } from 'react'
import { createPrefetchContext } from '../server/prefetch'
import type { ServerKnotDef, ServerContext } from '../server/prefetch'
import { TelarRootProvider } from './TelarRootProvider'

type TelarRootProps = {
  children:       ReactNode
  /**
   * Nodos con función `server` que se prefetchean antes del primer render.
   * Cada nodo ejecuta `server(prefetchCtx)` en el servidor y el resultado
   * viaja serializado como `initialValues` al store del cliente.
   *
   * @example
   * <TelarRoot prefetchNodes={[userKnot, cartKnot]}>
   *   <App />
   * </TelarRoot>
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prefetchNodes?: readonly ServerKnotDef<any>[]
  /**
   * Contexto pasado a cada función `server`. Útil para incluir la sesión,
   * headers de request, o cualquier dato de servidor que los knots necesiten.
   *
   * @example
   * <TelarRoot prefetchCtx={{ session: await getSession() }} prefetchNodes={[userKnot]}>
   */
  prefetchCtx?:   ServerContext
}

/**
 * Proveedor del store de Telar como React Server Component.
 *
 * Ejecuta el prefetch de los nodos indicados directamente en el servidor,
 * sin necesidad de un Server Component intermediario. Los datos viajan
 * serializados al cliente e hidratan el store antes del primer render:
 * los componentes nunca ven el estado por defecto.
 *
 * Para persistencia Worker o uiCache, envolver los hijos con `<TelarPersistence>`.
 *
 * @example
 * // app/dashboard/page.tsx — Server Component
 * export default async function Page() {
 *   return (
 *     <TelarRoot prefetchNodes={[userKnot, cartKnot]}>
 *       <Dashboard />
 *     </TelarRoot>
 *   )
 * }
 *
 * @example
 * // Con contexto de sesión
 * export default async function Page() {
 *   return (
 *     <TelarRoot
 *       prefetchCtx={{ session: await getSession() }}
 *       prefetchNodes={[userKnot]}
 *     >
 *       <Dashboard />
 *     </TelarRoot>
 *   )
 * }
 *
 * @example
 * // Con persistencia Worker
 * export default async function Page() {
 *   return (
 *     <TelarRoot prefetchNodes={[profileKnot]}>
 *       <TelarPersistence worker={worker} persistedNodes={[themeKnot]}>
 *         <App />
 *       </TelarPersistence>
 *     </TelarRoot>
 *   )
 * }
 */
export async function TelarRoot({
  children,
  prefetchNodes = [],
  prefetchCtx,
}: TelarRootProps) {
  const prefetch = createPrefetchContext(prefetchCtx)
  await Promise.all(prefetchNodes.map(n => prefetch(n)))

  return (
    <TelarRootProvider initialValues={prefetch.flush()}>
      {children}
    </TelarRootProvider>
  )
}
