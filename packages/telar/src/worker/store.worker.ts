import type { MainToWorker, WorkerToMain, NodeMeta } from './worker-messages'
import { getOrCreateKey, encryptValue, decryptValue, getStoredVersion, setStoredVersion, type EncryptedEntry } from './crypto'

// ─── Configuración (recibida via 'init') ──────────────────────────────────────

const DEFAULTS = {
  maxValueBytes: 50_000,   // 50 KB por valor serializado
  maxEntries:    500,      // máximo de entradas en IDB
}

let allowedKeys   = new Set<string>()
let nodeSchemas   = new Map<string, NodeMeta>()
let maxValueBytes = DEFAULTS.maxValueBytes
let maxEntries    = DEFAULTS.maxEntries
let persistence   = 'session' as 'session' | 'permanent'
let sessionId     = ''

// ─── IDB ─────────────────────────────────────────────────────────────────────

const DB_NAME    = 'telar-store'
const DB_VERSION = 1
const STORE_NAME = 'nodes'

type IDBEntry = { key: string; sessionId?: string } & EncryptedEntry

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    req.onsuccess = () => {
      const db = req.result
      // Cuando alguien llama indexedDB.deleteDatabase('telar-store') desde el
      // main thread, el navegador emite 'versionchange' en todas las conexiones
      // abiertas pidiéndoles que cierren. Sin este handler la eliminación queda
      // bloqueada indefinidamente y la base de datos no desaparece del inspector.
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
    req.onerror = () => reject(req.error)
  })
}

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = openDB()
  return dbPromise
}

function idbGetAll(db: IDBDatabase): Promise<IDBEntry[]> {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.getAll()
    req.onsuccess = () => resolve(req.result as IDBEntry[])
    req.onerror   = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, entry: IDBEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.put(entry)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

function idbCount(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.count()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

function idbClear(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.clear()
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ─── Capa 1: Validación de keys ───────────────────────────────────────────────

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function isValidKey(key: string): boolean {
  if (typeof key !== 'string')              return false
  if (key.length === 0 || key.length > 256) return false
  if (DANGEROUS_KEYS.has(key))              return false
  if (key.startsWith('__'))                 return false
  // Si se recibió 'init', solo keys de la lista blanca
  if (allowedKeys.size > 0 && !allowedKeys.has(key)) return false
  return true
}

// ─── Capa 3: Validación de tipos y constraints ────────────────────────────────

function matchesSchema(value: unknown, schema: NodeMeta): boolean {
  switch (schema.valueType) {
    case 'null':    return value === null
    case 'array':   return Array.isArray(value)
    case 'object':  return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    )
    default:        return typeof value === schema.valueType
  }
}

function matchesConstraints(value: unknown, schema: NodeMeta): boolean {
  const c = schema.constraints
  if (!c) return true

  // maxLength: strings y arrays
  if (c.maxLength !== undefined) {
    if (typeof value === 'string' && value.length > c.maxLength) return false
    if (Array.isArray(value)     && value.length > c.maxLength) return false
  }

  // min / max: números
  if (typeof value === 'number') {
    if (c.min !== undefined && value < c.min) return false
    if (c.max !== undefined && value > c.max) return false
  }

  // allowedValues: enum exacto
  if (c.allowedValues !== undefined) {
    if (!c.allowedValues.includes(value)) return false
  }

  return true
}

// ─── Capa 4: Write throttle ───────────────────────────────────────────────────

const pendingWrites = new Map<string, unknown>()
let flushTimer: ReturnType<typeof setTimeout> | null = null

async function flush(): Promise<void> {
  flushTimer = null

  // Snapshot del batch actual — nuevas escrituras durante el flush
  // van al próximo batch, no se pierden
  const batch = new Map(pendingWrites)
  pendingWrites.clear()

  const db        = await getDB()
  const cryptoKey = await getOrCreateKey()

  for (const [nodeKey, value] of batch) {
    try {
      const { iv, ciphertext } = await encryptValue(cryptoKey, value)
      const entry: IDBEntry = persistence === 'session'
        ? { key: nodeKey, iv, ciphertext, sessionId }
        : { key: nodeKey, iv, ciphertext }
      await idbPut(db, entry)
    } catch {
      // Error de cifrado o IDB — no romper la app, siguiente valor continúa
    }
  }
}

function schedulePersist(nodeKey: string, value: unknown): void {
  pendingWrites.set(nodeKey, value)
  if (flushTimer !== null) return
  flushTimer = setTimeout(() => { void flush() }, 300)
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', async (event: MessageEvent<MainToWorker>) => {
  const msg = event.data

  // ── init ──────────────────────────────────────────────────────────────────
  if (msg.type === 'init') {
    allowedKeys   = new Set(msg.nodes.map(n => n.key))
    nodeSchemas   = new Map(msg.nodes.map(n => [n.key, n]))
    maxValueBytes = msg.maxValueBytes ?? DEFAULTS.maxValueBytes
    maxEntries    = msg.maxEntries    ?? DEFAULTS.maxEntries
    persistence   = msg.persistence   ?? 'session'
    sessionId     = msg.sessionId     ?? ''

    // Invalidación por versión: si la versión cambió respecto a la almacenada,
    // limpiar toda la IndexedDB antes de que llegue el get-snapshot.
    // Garantiza que datos con esquemas anteriores no contaminen la nueva versión.
    if (msg.version !== undefined) {
      const storedVersion = await getStoredVersion()
      if (storedVersion !== msg.version) {
        const db = await getDB()
        await idbClear(db)
        await setStoredVersion(msg.version)
      }
    }

    return
  }

  // ── get-snapshot ──────────────────────────────────────────────────────────
  if (msg.type === 'get-snapshot') {
    const db        = await getDB()
    const cryptoKey = await getOrCreateKey()
    const entries   = await idbGetAll(db)

    // Object.create(null) — sin prototype, inmune a pollution
    const data = Object.create(null) as Record<string, unknown>

    const orphanKeys: string[] = []

    for (const entry of entries) {
      // Modo session: descartar y marcar para borrar entradas de otras sesiones
      if (persistence === 'session') {
        if (entry.sessionId !== sessionId) {
          orphanKeys.push(entry.key)
          continue
        }
      }

      // Capa 1: validar key
      if (!isValidKey(entry.key)) continue

      // Capa 2: descifrar — si falla, el dato fue manipulado → descartar
      let value: unknown
      try {
        value = await decryptValue(cryptoKey, entry.iv, entry.ciphertext)
      } catch {
        continue
      }

      // Capa 3: validar tipo y constraints contra schema
      const schema = nodeSchemas.get(entry.key)
      if (schema && !matchesSchema(value, schema))      continue
      if (schema && !matchesConstraints(value, schema)) continue

      data[entry.key] = value
    }

    // Limpiar entradas huérfanas de sesiones anteriores
    for (const orphanKey of orphanKeys) {
      try { await idbDelete(db, orphanKey) } catch { /* ignorar */ }
    }

    ;(self as unknown as Worker).postMessage({ type: 'snapshot', data } satisfies WorkerToMain)
    return
  }

  // ── clear ─────────────────────────────────────────────────────────────────
  if (msg.type === 'clear') {
    const db = await getDB()
    if (msg.keys && msg.keys.length > 0) {
      // Borrado parcial: solo las keys indicadas
      for (const key of msg.keys) {
        if (isValidKey(key)) await idbDelete(db, key)
      }
    } else {
      // Borrado total
      await idbClear(db)
    }
    return
  }

  // ── persist ───────────────────────────────────────────────────────────────
  if (msg.type === 'persist') {
    const { key, value } = msg

    // Capa 1: validar key
    if (!isValidKey(key)) return

    // Capa 1: límite de tamaño del valor
    const serialized = JSON.stringify(value)
    if (serialized.length > maxValueBytes) return

    // Capa 1: límite de entradas totales (solo keys fuera de la whitelist)
    if (!allowedKeys.has(key)) {
      const db    = await getDB()
      const count = await idbCount(db)
      if (count >= maxEntries) return
    }

    // Capa 4: encolar con debounce
    schedulePersist(key, value)
  }
})
