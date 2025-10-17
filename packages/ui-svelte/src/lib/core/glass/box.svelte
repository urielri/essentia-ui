<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import * as THREE from "three";
  import GlassPlane from "./glass-pane.svelte";
  import AnimatedBox from "./animated-box.svelte";
  import type { WebGLRenderer } from "three";

  export let distortion: number = 1.0; // 1. REFERENCIA AL COMPONENTE SVELTE: para acceder a la función 'update'

  let animatedBoxComponent: { update: (elapsed: number) => void } | undefined; // 2. REFERENCIA AL OBJETO THREE.Mesh: se enlaza con la prop expuesta en AnimatedBox

  let activeMesh: THREE.Mesh | undefined;

  // CRÍTICO: Función para crear un renderer con fondo transparente
  const createTransparentRenderer = (
    canvas: HTMLCanvasElement,
  ): WebGLRenderer => {
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true, // <--- Aquí se fuerza la transparencia
      premultipliedAlpha: true, // <--- Necesario para transparencia en WebGL
    });
    return renderer;
  };
</script>

<div class="glass-box-container">
  <div class="canvas-layer">
    <!-- CRÍTICO: Pasamos la función createTransparentRenderer -->
    <Canvas createRenderer={createTransparentRenderer}>
      <T.PerspectiveCamera position={[0, 0, 5]} fov={75} />
      <T.AmbientLight intensity={0.5} />
      <T.DirectionalLight position={[1, 1, 1]} intensity={1.5} />

      <AnimatedBox
        bind:this={animatedBoxComponent}
        bind:meshReference={activeMesh}
      />

      {#if activeMesh && animatedBoxComponent}
        <GlassPlane {activeMesh} {distortion} />
      {/if}
    </Canvas>
  </div>
  <div class="content-layer">
    <slot />
  </div>
</div>

<style>
  /* Contenedor principal */
  .glass-box-container {
    position: relative;
    width: 100%;
    height: 400px;
    border-radius: 1rem;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  /* La capa del canvas debe ser absoluta */
  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1; /* Fondo */
  }

  /* La capa de contenido (slot) debe estar encima del canvas.
 */
  .content-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2; /* Encima del canvas */
    /* Flexbox opcional para centrar el contenido del slot */
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    /* Estilos de glassmorphism visuales (con desenfoque) */
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.05);
  }
</style>
