import type { Graph } from './types'

/**
 * BFS desde un nodo cambiado hacia todos los threads que dependen de él
 * (directa o transitivamente). Retorna el conjunto de nodos afectados,
 * sin incluir el nodo origen.
 */
export function getDirtyNodes(changedKey: string, graph: Graph): Set<string> {
  const dirty = new Set<string>()
  const queue: string[] = [changedKey]

  while (queue.length > 0) {
    const current = queue.shift()!
    const subscribers = graph.nodeSubscriptions.get(current)
    if (!subscribers?.size) continue

    for (const sub of subscribers) {
      if (!dirty.has(sub)) {
        dirty.add(sub)
        queue.push(sub)
      }
    }
  }

  return dirty
}

/**
 * Reconstruye las aristas del grafo para un nodo dado.
 * Elimina las dependencias viejas y registra las nuevas.
 * Se llama cada vez que un thread se re-evalúa.
 */
export function rebuildGraphEdges(
  graph: Graph,
  nodeKey: string,
  newDeps: Set<string>,
): void {
  const oldDeps = graph.nodeDeps.get(nodeKey) ?? new Set<string>()

  // Eliminar aristas viejas
  for (const dep of oldDeps) {
    graph.nodeSubscriptions.get(dep)?.delete(nodeKey)
  }

  // Registrar aristas nuevas
  graph.nodeDeps.set(nodeKey, newDeps)

  for (const dep of newDeps) {
    if (!graph.nodeSubscriptions.has(dep)) {
      graph.nodeSubscriptions.set(dep, new Set())
    }
    graph.nodeSubscriptions.get(dep)!.add(nodeKey)
  }
}
