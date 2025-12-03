<!-- src/core/debug/FpsMonitor.svelte -->
<script lang="ts">
  import { useTask } from "@threlte/core";
  import { HTML } from "@threlte/extras"; // Renderiza HTML dentro de la escena 3D

  // export let debugMode: boolean = false;
  interface Props {
    debugMode?: boolean; // Propiedad opcional
  }

  const { debugMode = false }: Props = $props();
  let fps = $state(0);
  let frames = 0;
  let prevTime = performance.now();

  // useTask se ejecuta en cada frame del render loop
  useTask(() => {
    frames++;
    const time = performance.now();

    // Cada 1000ms (1 segundo), actualizamos el contador
    if (time >= prevTime + 1000) {
      fps = frames;
      frames = 0;
      prevTime = time;
    }
  });
</script>

<!-- Html con la prop "fullscreen" evita que el texto se mueva con la cámara -->
{#if debugMode}
  <HTML fullscreen zIndexRange={[-1, 1]}>
    <div class="monitor">
      FPS: {fps}
    </div>
  </HTML>
{/if}

<style>
  .monitor {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.6);
    color: #00ffcc; /* Color estilo Essentia */
    font-family: monospace;
    font-size: 12px;
    font-weight: bold;
    border-radius: 4px;
    pointer-events: none;
    z-index: 9999;
  }
</style>
