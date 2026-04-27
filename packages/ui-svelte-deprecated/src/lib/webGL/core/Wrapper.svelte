<script lang="ts">
  import { Canvas } from "@threlte/core";
  import SceneDefault from "./SceneDefault.svelte";
  import { createEngine } from "./state.svelte";
  import Debug from "../utils/Debug.svelte";

  const isDevelopment = import.meta.env.DEV;
  export let className: string = "";
  export let uiClassName: string = "";

  // 1. Inicializar el estado global con Runes
  // Al crearlo aquí, todos los hijos (dentro y fuera del canvas) pueden acceder via useEssentia()
  const engine = createEngine();

  // Props de configuración para el Canvas
  const canvasSettings = {
    toneMapping: 3 as any, // ACESFilmicToneMapping (Mejor para realismo)
    shadows: true,
    useLegacyLights: false,
  };
</script>

<!-- Contenedor DOM -->
<div class="essentia-root {className}">
  <!-- Capa 1: WebGL Canvas -->
  <div class="canvas-layer">
    <Canvas {...canvasSettings} dpr={engine.dpr}>
      <!-- Debug Tools (Condicionales) -->
      {#if isDevelopment}
        <Debug debugMode={engine.debugMode} />
      {/if}

      <!-- La Escena: Aquí inyectamos el contenido de la app -->
      <!-- Usamos SceneDefault solo si no hay contenido, o como base -->
      <SceneDefault />

      <!-- Slot dentro del contexto 3D: Aquí irán tus componentes Layout, GlassObject, etc. -->
      <slot />
    </Canvas>
  </div>

  <!-- Capa 2: Overlay DOM  -->
  <!-- A veces necesitas una capa HTML encima para accesibilidad o loaders 2D -->
  <div class="ui-overlay {uiClassName}">
    <!-- Aquí podrías poner slots para UI que NO es 3D si fuera necesario -->
    <slot name="ui" />
  </div>
</div>

<style>
  .essentia-root {
    width: 100%;
    height: 100%;
    min-height: 100vh;
    position: relative;
    background-color: red; /* Fondo base por si el canvas tarda en cargar */
    /**
* TODO: Agregar las variables css para poder seguir manteniendo la consistencia con el figma
*/
    overflow: hidden;
  }

  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* IMPORTANTE: Esto debe permitir eventos para que el Raycaster funcione */
    pointer-events: auto;
    z-index: 1;
  }

  .ui-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Deja pasar clicks al Canvas */
    z-index: 2;
  }
</style>
