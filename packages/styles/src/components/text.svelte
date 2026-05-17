<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { useEngine } from 'essentia-core'
  import { TextNode, type TextAlignment } from '../nodes/text-node.js'

  interface Props {
    /** Contenido textual a renderizar. */
    text: string
    /** Tamaño de fuente en unidades de mundo (= píxeles con cámara 1:1). @default 16 */
    fontSize?: number
    /** Color CSS hex o nombre. @default '#ffffff' */
    color?: string
    /** URL de la fuente (.ttf, .otf, .woff). @default fuente del sistema de troika */
    font?: string
    /** Alineación horizontal del bloque de texto. @default 'left' */
    alignment?: TextAlignment
    /** Anclaje X normalizado [0..1]. 0 = izquierda, 0.5 = centro, 1 = derecha. @default 0 */
    anchorX?: number
    /** Anclaje Y normalizado [0..1]. 0 = arriba, 0.5 = centro, 1 = abajo. @default 0 */
    anchorY?: number
    /** Ancho máximo antes de hacer wrap. @default Infinity (sin wrap) */
    maxWidth?: number
    /** Altura de línea como multiplicador de fontSize. @default 1.2 */
    lineHeight?: number
    /** Espaciado entre letras en unidades de mundo. @default 0 */
    letterSpacing?: number
    x?: number
    y?: number
    z?: number
  }

  let {
    text,
    fontSize = 16,
    color = '#ffffff',
    font,
    alignment = 'left',
    anchorX = 0,
    anchorY = 0,
    maxWidth = Infinity,
    lineHeight = 1.2,
    letterSpacing = 0,
    x = 0,
    y = 0,
    z = 0,
  }: Props = $props()

  const { invalidate } = useThrelte()
  const engine = useEngine()

  // Construcción una sola vez. El shell solo orquesta props → setters del nodo.
  const node = new TextNode({
    text,
    fontSize,
    color,
    font,
    alignment,
    anchorX,
    anchorY,
    maxWidth,
    lineHeight,
    letterSpacing,
  })

  // troika.sync() solo ejecuta el callback si _needsSync === true. En el primer
  // render los props son idénticos a los del constructor → _needsSync = false →
  // el callback se descarta. El evento 'synccomplete' se despacha dentro del
  // if(_needsSync) del constructor, por lo que sí llega al listener.
  const onSyncComplete = () => invalidate()
  node.mesh.addEventListener('synccomplete', onSyncComplete)

  // Sync reactivo: props → setters del nodo.
  // Single $effect — todos los setters disparan sync() de troika internamente.
  $effect(() => {
    node.setText(text)
    node.setFontSize(fontSize)
    node.setColor(color)
    node.setFont(font)
    node.setAlignment(alignment)
    node.setAnchorX(anchorX)
    node.setAnchorY(anchorY)
    node.setMaxWidth(maxWidth)
    node.setLineHeight(lineHeight)
    node.setLetterSpacing(letterSpacing)
    node.setPosition(x, y, z)

    invalidate()
  })

  // Registro en foregroundMeshes: BackgroundCapture oculta estos meshes durante
  // la captura del fondo para evitar que aparezcan como fantasmas a través del Glass.
  $effect(() => {
    engine.foregroundMeshes.add(node.mesh)
    return () => {
      engine.foregroundMeshes.delete(node.mesh)
    }
  })

  // Cleanup: destroy() libera el atlas y material de troika vía disposable.
  $effect(() => {
    return () => {
      node.mesh.removeEventListener('synccomplete', onSyncComplete)
      node.destroy()
    }
  })
</script>

<T is={node.root} />
