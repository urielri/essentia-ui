// ─── Setter ──────────────────────────────────────────────────────────────────

export type SetterOrUpdater<T> = T | ((prev: T) => T)

// ─── Read context (passed to thread's get fn) ─────────────────────────────────

export type ReadContext = {
  read: <T>(node: AnyNode<T>) => T
}

// ─── Reducers ────────────────────────────────────────────────────────────────

export type Reducers<T> = {
  [key: string]: (state: T, ...args: any[]) => T
}

export type Dispatch<T, R extends Reducers<T>> = {
  [K in keyof R]: R[K] extends (state: T, ...args: infer A) => T
    ? (...args: A) => void
    : never
}

// ─── Node definitions (branded) ──────────────────────────────────────────────

export type KnotDef<T> = {
  readonly _brand: 'knot'
  readonly key: string
  readonly default: T
}

export type ThreadDef<T> = {
  readonly _brand: 'thread'
  readonly key: string
  readonly get: (ctx: ReadContext) => T
}

export type BindDef<T, R extends Reducers<T>> = {
  readonly _brand: 'bind'
  readonly key: string
  readonly default: T
  readonly reducers: R
}

export type AnyNode<T> = KnotDef<T> | ThreadDef<T> | BindDef<T, Reducers<T>>

// ─── Graph ───────────────────────────────────────────────────────────────────

export type Graph = {
  /** thread key → set of knot/thread keys it reads */
  nodeDeps: Map<string, Set<string>>
  /** knot/thread key → set of thread keys that read it */
  nodeSubscriptions: Map<string, Set<string>>
}

// ─── Store ───────────────────────────────────────────────────────────────────

export type Store = {
  values: Map<string, unknown>
  graph: Graph
  /** node key → set of component listener callbacks */
  listeners: Map<string, Set<() => void>>
  /** thread key → cached computed value */
  cache: Map<string, unknown>
}
