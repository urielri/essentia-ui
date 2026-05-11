/**
 * Declaraciones ambient mínimas para `troika-three-text`.
 * La librería NO publica `.d.ts` propios. Cubrimos solo la API que usamos
 * en `TextNode` para mantener type-safety en el wrapper.
 */
declare module 'troika-three-text' {
  import { Mesh, Material, Color } from 'three'

  /**
   * Mesh de texto MSDF con API declarativa.
   * Las propiedades modifican el estado interno; llamar `sync()` para
   * regenerar el atlas y refrescar la geometría.
   */
  export class Text extends Mesh {
    /** Contenido textual a renderizar. */
    text: string
    /** Tamaño de fuente en unidades de mundo. */
    fontSize: number
    /** Color del texto: hex number, string CSS o Color de three. */
    color: number | string | Color
    /** URL de fuente custom (`.ttf`/`.otf`/`.woff`). `null` = default. */
    font: string | null
    /** Alineación horizontal del bloque. */
    textAlign: 'left' | 'right' | 'center' | 'justify'
    /** Anclaje X: keyword (`'left'`, `'center'`, `'right'`) o número [0..1]. */
    anchorX: string | number
    /** Anclaje Y: keyword (`'top'`, `'middle'`, `'bottom'`) o número [0..1]. */
    anchorY: string | number
    /** Ancho máximo antes de wrap. `Infinity` = sin wrap. */
    maxWidth: number
    /** Altura de línea como multiplicador de fontSize. */
    lineHeight: number
    /** Espaciado entre letras en unidades de mundo. */
    letterSpacing: number
    /** Material override opcional. */
    material: Material

    /**
     * Lanza la generación async del atlas MSDF y actualiza la geometría.
     * El callback (si se provee) se dispara cuando el sync se completa.
     */
    sync(callback?: () => void): void

    /**
     * Libera el atlas y material de troika.
     */
    dispose(): void
  }
}
