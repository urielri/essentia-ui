import { Text } from 'troika-three-text'
import { Color } from 'three'
import { EssentiaNode } from 'essentia-core'

/**
 * Alineación horizontal del texto. Mapea directamente a troika `textAlign`.
 */
export type TextAlignment = 'left' | 'center' | 'right' | 'justify'

/**
 * Anclaje normalizado [0..1] que se traduce a strings de troika.
 * 0 = left/top, 0.5 = center, 1 = right/bottom.
 */
export type AnchorNormalized = number

/**
 * Opciones de construcción del TextNode.
 * Todos los campos visuales son opcionales con defaults sensatos.
 */
export type TextNodeOptions = {
  /** Contenido textual a renderizar. @default '' */
  text?: string
  /** Tamaño de fuente en unidades de mundo (= píxeles con cámara 1:1). @default 16 */
  fontSize?: number
  /** Color CSS hex o nombre. @default '#ffffff' */
  color?: string
  /** URL de la fuente (formato .ttf, .otf o .woff). @default fuente del sistema */
  font?: string
  /** Alineación horizontal. @default 'left' */
  alignment?: TextAlignment
  /** Anclaje X normalizado [0..1]. 0 = izquierda, 0.5 = centro, 1 = derecha. @default 0 */
  anchorX?: AnchorNormalized
  /** Anclaje Y normalizado [0..1]. 0 = arriba, 0.5 = centro, 1 = abajo. @default 0 */
  anchorY?: AnchorNormalized
  /** Ancho máximo antes de hacer wrap. @default Infinity (sin wrap) */
  maxWidth?: number
  /** Altura de línea como multiplicador de fontSize. @default 1.2 */
  lineHeight?: number
  /** Espaciado entre letras en unidades de mundo. @default 0 */
  letterSpacing?: number
}

/**
 * Traduce un valor normalizado [0..1] al string esperado por troika.
 * Valores intermedios usan números, los extremos pueden usar keywords.
 */
function normalizeToAnchorX(value: number): string | number {
  if (value === 0) return 'left'
  if (value === 0.5) return 'center'
  if (value === 1) return 'right'
  return value
}

function normalizeToAnchorY(value: number): string | number {
  if (value === 0) return 'top'
  if (value === 0.5) return 'middle'
  if (value === 1) return 'bottom'
  return value
}

/**
 * Nodo de UI que renderiza texto MSDF vía troika-three-text.
 *
 * Encapsula el `Text` mesh de troika y expone una API tipada para mutar
 * cada parámetro visual. El motor MSDF de troika gestiona la generación
 * del atlas y el shader internamente.
 *
 * El `root` del nodo es directamente el `Text` mesh — esto permite que el
 * scene graph de Three.js herede transformaciones desde un padre
 * `EssentiaNode` sin nodos intermedios.
 *
 * Nota: troika carga las fuentes de forma asíncrona. El método `sync()` se
 * llama automáticamente tras cada setter; el callback se dispara cuando
 * el mesh está listo para renderizar.
 */
export class TextNode extends EssentiaNode {
  readonly mesh: Text

  constructor(options: TextNodeOptions = {}) {
    const mesh = new Text()

    // Defaults: aplicados al construir
    mesh.text = options.text ?? ''
    mesh.fontSize = options.fontSize ?? 16
    mesh.color = new Color(options.color ?? '#ffffff').getHex()
    if (options.font) mesh.font = options.font
    mesh.textAlign = options.alignment ?? 'left'
    mesh.anchorX = normalizeToAnchorX(options.anchorX ?? 0)
    mesh.anchorY = normalizeToAnchorY(options.anchorY ?? 0)
    mesh.maxWidth = options.maxWidth ?? Infinity
    mesh.lineHeight = options.lineHeight ?? 1.2
    mesh.letterSpacing = options.letterSpacing ?? 0

    // Sync inicial: lanza la generación async del atlas MSDF
    mesh.sync()

    super(mesh)
    this.mesh = mesh

    // Troika Text expone dispose() para liberar atlas y material
    this.addDisposable({ dispose: () => mesh.dispose() })
  }

  /**
   * Actualiza el contenido textual. Dispara re-sync del atlas MSDF.
   */
  setText(text: string): this {
    this.mesh.text = text
    this.mesh.sync()
    return this
  }

  /**
   * Actualiza el tamaño de fuente. Dispara re-sync.
   */
  setFontSize(size: number): this {
    this.mesh.fontSize = size
    this.mesh.sync()
    return this
  }

  /**
   * Actualiza el color. Parsea string CSS a hex.
   */
  setColor(color: string): this {
    this.mesh.color = new Color(color).getHex()
    return this
  }

  /**
   * Actualiza la URL de la fuente. Dispara re-sync con carga async.
   */
  setFont(url: string | undefined): this {
    this.mesh.font = url ?? null
    this.mesh.sync()
    return this
  }

  /**
   * Actualiza la alineación horizontal del bloque de texto.
   */
  setAlignment(alignment: TextAlignment): this {
    this.mesh.textAlign = alignment
    this.mesh.sync()
    return this
  }

  /**
   * Actualiza el anclaje X. Valor normalizado [0..1].
   */
  setAnchorX(value: AnchorNormalized): this {
    this.mesh.anchorX = normalizeToAnchorX(value)
    this.mesh.sync()
    return this
  }

  /**
   * Actualiza el anclaje Y. Valor normalizado [0..1].
   */
  setAnchorY(value: AnchorNormalized): this {
    this.mesh.anchorY = normalizeToAnchorY(value)
    this.mesh.sync()
    return this
  }

  /**
   * Actualiza el ancho máximo antes de hacer wrap.
   * Usar `Infinity` para deshabilitar wrap.
   */
  setMaxWidth(width: number): this {
    this.mesh.maxWidth = width
    this.mesh.sync()
    return this
  }

  /**
   * Actualiza la altura de línea (multiplicador de fontSize).
   */
  setLineHeight(height: number): this {
    this.mesh.lineHeight = height
    this.mesh.sync()
    return this
  }

  /**
   * Actualiza el espaciado entre letras (en unidades de mundo).
   */
  setLetterSpacing(spacing: number): this {
    this.mesh.letterSpacing = spacing
    this.mesh.sync()
    return this
  }
}
