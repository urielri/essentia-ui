<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Canvas } from '@threlte/core'
  import OrthoCamera from '../core/ortho-camera.svelte'
  import { createEngine } from '../core/engine.svelte.js'

  interface Props {
    class?: string
    style?: string
    /**
     * Contenido de la escena 3D. Debe ser un árbol de componentes Threlte.
     * Toda lógica GPU va aquí: meshes, luces, efectos.
     */
    children?: Snippet
    /**
     * Overlay DOM. Se renderiza sobre el canvas con pointer-events: none.
     * Uso: Ghost Inputs, Shadow Layer para accesibilidad.
     */
    ui?: Snippet
  }

  let { class: className = '', style = '', children, ui }: Props = $props()

  const engine = createEngine()
</script>

<div class="essentia-root {className}" {style}>
  <Canvas>
    <OrthoCamera {engine} />
    {@render children?.()}
  </Canvas>

  {#if ui}
    <div class="essentia-ui-layer" aria-hidden="true">
      {@render ui()}
    </div>
  {/if}
</div>

<style>
  .essentia-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /*
    El canvas de Threlte ocupa el 100% por defecto.
    z-index explícito para cuando se agregue la UI layer.
  */
  .essentia-root :global(canvas) {
    display: block;
    position: relative;
    z-index: 1;
  }

  /*
    Capa DOM sobre el canvas. pointer-events: none por defecto —
    los Ghost Inputs individuales opt-in a pointer-events: auto.
  */
  .essentia-ui-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }
</style>
