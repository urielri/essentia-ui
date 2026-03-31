/**
 * Tipo JavaScript del valor por defecto de un nodo persistido.
 * Usado por el Worker para validar que los datos leídos de IndexedDB
 * coinciden con el tipo esperado antes de hidratarlos en el store.
 */
export type NodeValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'

/**
 * Restricciones de valor opcionales por nodo.
 * El Worker las aplica al leer de IndexedDB para descartar valores
 * que pasen la validación de tipo pero violen reglas de negocio.
 * Mitiga el impacto de XSS que logre escribir en IndexedDB con la CryptoKey.
 */
export type NodeConstraints = {
  /** Longitud máxima — para strings (chars) y arrays (elementos). */
  maxLength?:     number
  /** Valor numérico mínimo (inclusive). Solo para valueType 'number'. */
  min?:           number
  /** Valor numérico máximo (inclusive). Solo para valueType 'number'. */
  max?:           number
  /** Lista de valores permitidos. Si se provee, el valor debe estar en ella. */
  allowedValues?: unknown[]
}

/**
 * Metadata de un nodo que se desea persistir.
 * El Worker construye con esto la lista blanca de keys válidas,
 * el schema de tipo y las constraints de valor opcionales.
 */
export type NodeMeta = {
  key:          string
  valueType:    NodeValueType
  constraints?: NodeConstraints
}

/**
 * Mensajes que el main thread envía al Worker.
 */
export type MainToWorker =
  /**
   * Enviado antes de get-snapshot. Configura la lista blanca de keys,
   * los schemas de tipo, las constraints y los límites operacionales.
   *
   * Si se provee `version` y difiere de la versión almacenada, el Worker
   * limpia toda la IndexedDB antes de responder el snapshot — garantizando
   * que datos de esquemas anteriores no contaminen la nueva versión.
   */
  | {
      type:           'init'
      nodes:          NodeMeta[]
      /**
       * Modo de persistencia:
       * - 'session'   (default) — los datos sobreviven recargas y navegación MPA
       *   dentro del mismo tab, pero se descartan al cerrar el navegador/tab.
       * - 'permanent' — los datos persisten entre sesiones del navegador.
       */
      persistence?:   'session' | 'permanent'
      /**
       * Identificador de sesión, requerido cuando persistence === 'session'.
       * Generado/leído por TelarRoot desde sessionStorage ('telar-session-id').
       * Cada entrada en IDB se tagea con este ID; entradas de sesiones anteriores
       * se descartan y limpian automáticamente en get-snapshot.
       */
      sessionId?:     string
      version?:       string
      maxValueBytes?: number
      maxEntries?:    number
    }
  | { type: 'get-snapshot' }
  | { type: 'persist'; key: string; value: unknown }
  /**
   * Invalida el store persistido. Si se proveen keys, solo borra esas
   * entradas de IndexedDB. Sin keys, borra todo.
   */
  | { type: 'clear'; keys?: string[] }

/**
 * Mensajes que el Worker envía al main thread.
 */
export type WorkerToMain =
  | { type: 'snapshot'; data: Record<string, unknown> }
