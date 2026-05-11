<script lang="ts">
  import { Glass, Text } from 'essentia-styles'
  import type { InteractivityProps } from '@threlte/extras'
  import {
    buildGlassButtonState,
    type GlassButtonVariant,
  } from './glass-button.config.js'

  interface Props {
    /** Texto del botón. */
    label: string
    /** Ancho del botón en píxeles. @default 160 */
    width?: number
    /** Alto del botón en píxeles. @default 44 */
    height?: number
    /** Radio de esquinas en píxeles. @default 22 */
    radius?: number
    /** Tamaño de fuente del label en píxeles. @default 16 */
    fontSize?: number
    /** Variante visual del botón. @default 'primary' */
    variant?: GlassButtonVariant
    /** Si está deshabilitado, no procesa clicks y se muestra atenuado. @default false */
    disabled?: boolean
    /** Posición X (centro del botón). */
    x?: number
    /** Posición Y (centro del botón). */
    y?: number
    /** Z-index para ordenamiento de capas. */
    z?: number
    /** Handler de click (raycast sobre el panel Glass). */
    onclick?: InteractivityProps['onclick']
  }

  let {
    label,
    width = 160,
    height = 44,
    radius = 22,
    fontSize = 16,
    variant = 'primary',
    disabled = false,
    x = 0,
    y = 0,
    z = 0,
    onclick,
  }: Props = $props()

  // Estado resuelto a partir de variant + disabled.
  // Es un getter ($derived) para que reaccione a cambios de props.
  const state = $derived(buildGlassButtonState({ variant, disabled }))

  function handleClick(e: Parameters<NonNullable<InteractivityProps['onclick']>>[0]) {
    if (!state.interactive) return
    onclick?.(e)
  }
</script>

<!--
  GlassButton: composición Glass + Text como hermanos en world space.
  El Text se posiciona con la misma (x, y) que el Glass, con z ligeramente
  mayor para garantizar que renderice encima.
-->
<Glass
  {width}
  {height}
  {radius}
  tint={state.glass.tint}
  tintOpacity={state.glass.tintOpacity}
  fresnelStrength={state.glass.fresnelStrength}
  blur={state.glass.blur}
  ior={state.glass.ior}
  distortion={state.glass.distortion}
  cursor={state.cursor}
  {x}
  {y}
  {z}
  onclick={handleClick}
/>
<Text
  text={label}
  {fontSize}
  color={state.text.color}
  anchorX={0.5}
  anchorY={0.5}
  {x}
  {y}
  z={z + 0.01}
/>
