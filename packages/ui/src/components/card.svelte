<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Glass } from 'essentia-styles'

  interface Props {
    /** Ancho del card en píxeles. */
    width: number
    /** Alto del card en píxeles. */
    height: number
    /** Radio de esquinas en píxeles. @default 16 */
    radius?: number
    /** Radio del kernel de blur (frosted glass). 0 = sin blur. @default 4 */
    blur?: number
    /** Color de tinte CSS. @default '#ffffff' */
    tint?: string
    /** Opacidad del tinte [0..1]. @default 0.06 */
    tintOpacity?: number
    /** Intensidad del brillo Fresnel en los bordes. @default 0.06 */
    fresnelStrength?: number
    /** Posición X del centro del card. */
    x?: number
    /** Posición Y del centro del card. */
    y?: number
    /** Z-index para ordenamiento. El contenido se renderiza en z + 0.01. */
    z?: number
    /**
     * Contenido del card. Las primitivas que se rendericen acá serán hermanas
     * del Glass background — Card NO hace layout interno. Para layouts más
     * ricos, envolver el contenido en `<Flex>/<Box>`.
     */
    children?: Snippet
  }

  let {
    width,
    height,
    radius = 16,
    blur = 4,
    tint = '#ffffff',
    tintOpacity = 0.06,
    fresnelStrength = 0.06,
    x = 0,
    y = 0,
    z = 0,
    children,
  }: Props = $props()
</script>

<!--
  Card: Glass de fondo + slot de contenido como hermano en world space.
  El consumidor posiciona el contenido relativo al centro del card via
  props x/y de cada primitiva interna.
-->
<Glass
  {width}
  {height}
  {radius}
  {blur}
  {tint}
  {tintOpacity}
  {fresnelStrength}
  {x}
  {y}
  {z}
/>
{@render children?.()}
