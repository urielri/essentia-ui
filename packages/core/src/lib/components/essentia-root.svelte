<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Texture } from 'three'
  import { Canvas } from '@threlte/core'
  import { Environment, Suspense } from '@threlte/extras'
  import OrthoCamera from '../core/ortho-camera.svelte'
  import BackgroundCapture from '../core/background-capture.svelte'
  import SceneBackground from '../core/scene-background.svelte'
  import Interactivity from '../core/interactivity.svelte'
  import { createEngine } from '../core/engine.svelte.js'
  import type { EnvironmentOptions } from './essentia-root.types.js'

  interface Props {
    class?: string
    style?: string
    /** Color de fondo de la escena (CSS hex o nombre). Se aplica a scene.background para que
     *  BackgroundCapture lo capture y Glass lo refracte correctamente. @default '#000000' */
    background?: string
    /**
     * Textura de entorno (equirectangular) ya construida. Tiene precedencia sobre
     * `environment` si ambos se proveen.
     */
    envMap?: Texture | null
    /**
     * Configuración para cargar el environment map automáticamente con
     * `<Environment/>`. Se ignora si `envMap` está presente.
     */
    environment?: EnvironmentOptions | null
    /**
     * Snippet de fallback (3D) que se renderiza dentro del Canvas mientras
     * cualquier descendiente está cargando recursos asíncronos (texturas vía
     * `<Image/>`, environment maps, etc.).
     *
     * Si está presente, los `children` se envuelven en `<Suspense>` y este
     * snippet sustituye el contenido durante la carga. Si no se provee, no hay
     * orquestación de Suspense — los componentes aparecen apenas su recurso
     * propio termina de cargar (sin coordinación global).
     */
    loading?: Snippet
    children?: Snippet
    ui?: Snippet
  }

  let {
    class: className = '',
    style = '',
    background = '#000000',
    envMap = null,
    environment = null,
    loading,
    children,
    ui,
  }: Props = $props()

  const engine = createEngine()

  // Textura cargada por <Environment/> (bindable). Solo se usa si no hay envMap explícito.
  let loadedEnvTexture: Texture | undefined = $state()

  // Priority: envMap explícito > textura cargada por <Environment/> > null.
  // El usuario decide entre control fino (Texture pre-construida) o conveniencia
  // (path al HDR + carga automática).
  $effect(() => {
    engine.envMap = envMap ?? loadedEnvTexture ?? null
  })
</script>

<div class="essentia-root {className}" {style}>
  <Canvas>
    <SceneBackground color={background} />
    <OrthoCamera {engine} />
    <BackgroundCapture />
    <Interactivity>
      {#if environment && !envMap}
        <Environment
          url={environment.url}
          isBackground={environment.isBackground ?? false}
          bind:texture={loadedEnvTexture}
        />
      {/if}
      {#if loading}
        <Suspense fallback={loading}>
          {@render children?.()}
        </Suspense>
      {:else}
        {@render children?.()}
      {/if}
    </Interactivity>
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
