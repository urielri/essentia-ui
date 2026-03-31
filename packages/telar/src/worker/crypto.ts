/**
 * Capa de cifrado AES-GCM para el Worker de persistencia de Telar.
 *
 * Usa la Web Crypto API disponible en Workers.
 *
 * La clave es:
 * - AES-256-GCM (AEAD: confidencialidad + integridad en una sola operación)
 * - non-extractable: nunca puede ser exportada como bytes raw
 * - Almacenada en una IDB separada ('telar-keystore') para persistir entre sesiones
 * - Generada automáticamente en la primera visita
 *
 * El IV (12 bytes) es aleatorio y único por escritura.
 * AES-GCM incluye un tag de autenticación: si alguien modifica el blob
 * almacenado, el descifrado falla con error detectable.
 */

const KEY_DB_NAME    = 'telar-keystore'
const KEY_STORE_NAME = 'keys'
const KEY_ID         = 'main'
const VERSION_ID     = 'version'

let cachedKey: CryptoKey | null = null

// ─── IDB para la clave ────────────────────────────────────────────────────────

let keyDbPromise: Promise<IDBDatabase> | null = null

function openKeyDB(): Promise<IDBDatabase> {
  if (keyDbPromise) return keyDbPromise
  keyDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(KEY_DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(KEY_STORE_NAME, { keyPath: 'id' })
    }
    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => {
        db.close()
        keyDbPromise = null
        cachedKey    = null
      }
      resolve(db)
    }
    req.onerror = () => {
      keyDbPromise = null
      reject(req.error)
    }
  })
  return keyDbPromise
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Retorna la CryptoKey activa. La genera si no existe aún y la cachea
 * en memoria para evitar lecturas repetidas a IDB.
 */
export async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey

  const db = await openKeyDB()

  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const tx    = db.transaction(KEY_STORE_NAME, 'readonly')
    const store = tx.objectStore(KEY_STORE_NAME)
    const req   = store.get(KEY_ID)
    req.onsuccess = () => resolve((req.result as { id: string; key: CryptoKey } | undefined)?.key)
    req.onerror   = () => reject(req.error)
  })

  if (existing) {
    cachedKey = existing
    return existing
  }

  // Generar clave nueva — non-extractable
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,                // non-extractable: los bytes raw nunca son accesibles
    ['encrypt', 'decrypt'],
  )

  // IDB puede almacenar CryptoKey natively via structured clone
  await new Promise<void>((resolve, reject) => {
    const tx    = db.transaction(KEY_STORE_NAME, 'readwrite')
    const store = tx.objectStore(KEY_STORE_NAME)
    const req   = store.put({ id: KEY_ID, key })
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })

  cachedKey = key
  return key
}

export type EncryptedEntry = {
  iv:         Uint8Array     // 12 bytes, único por escritura
  ciphertext: ArrayBuffer    // incluye tag de autenticación GCM
}

// ─── Versión del store ────────────────────────────────────────────────────────

/**
 * Lee la versión almacenada en `telar-keystore`.
 * Retorna `undefined` si nunca se guardó una versión.
 */
export async function getStoredVersion(): Promise<string | undefined> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(KEY_STORE_NAME, 'readonly')
    const store = tx.objectStore(KEY_STORE_NAME)
    const req   = store.get(VERSION_ID)
    req.onsuccess = () => resolve((req.result as { id: string; value: string } | undefined)?.value)
    req.onerror   = () => reject(req.error)
  })
}

/**
 * Guarda la versión actual del store en `telar-keystore`.
 */
export async function setStoredVersion(version: string): Promise<void> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(KEY_STORE_NAME, 'readwrite')
    const store = tx.objectStore(KEY_STORE_NAME)
    const req   = store.put({ id: VERSION_ID, value: version })
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ─── Cifrado ──────────────────────────────────────────────────────────────────

/**
 * Cifra un valor JavaScript a un blob AES-GCM.
 * El IV es generado aleatoriamente — no reutilizar nunca el mismo IV.
 */
export async function encryptValue(key: CryptoKey, value: unknown): Promise<EncryptedEntry> {
  const iv        = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  )
  return { iv, ciphertext }
}

/**
 * Descifra un blob AES-GCM a su valor JavaScript original.
 * Lanza error si el blob fue modificado (tag de autenticación inválido).
 */
export async function decryptValue(
  key:        CryptoKey,
  iv:         Uint8Array,
  ciphertext: ArrayBuffer,
): Promise<unknown> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )
  return JSON.parse(new TextDecoder().decode(decrypted))
}
