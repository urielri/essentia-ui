<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import { onMount } from "svelte";
  import * as THREE from "three";

  import type { CanvasTexture, Mesh, WebGLRenderer } from "three";
  import AnimatedBox from "./animated-box.svelte";
  import GlassBoxLogic from "./box.logic.svelte";
  import { captureBackground, updateThreeJsPlane } from "./html2canvas-logic";
  import TextureDebugPlane from "./texture-debug-plane.svelte";

  export let isSuspended: boolean = false;
  export let captureStrategy: "html" | "3d" = "html";
  export let distortion: number = 9.0;
  export let className: string = "";
  export let style: string = "";
  export let debug: boolean = false;

  export let mouseX = 0;
  export let mouseY = 0;

  export let lookAt: boolean = true;
  export let canRenderOnScroll: boolean = false;
  export let canRenderOnResize: boolean = false;

  export const SENSITIVITY = 0.1;

  let width3D: number;
  let height3D: number;

  let activeMesh: Mesh | undefined;

  let backgroundContentRef: HTMLDivElement;

  let backgroundTexture: CanvasTexture | THREE.Texture | undefined;
  let backgroundMesh: Mesh | undefined;

  let canvasLayerRef: HTMLDivElement | undefined;
  let threlteCanvas: HTMLCanvasElement | undefined;
  let contentRef: HTMLDivElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  // ESTADO DE DEPURACIÓN Y CAPTURA
  let capturedImageURL: string | null = null;

  let capturedCanvas: HTMLCanvasElement | undefined = undefined;

  let renderTarget: THREE.WebGLRenderTarget | null = null;
  // CONSTANTES 3D
  const CAMERA_FOV = 75;
  const BACKGROUND_Z = -5; // Posición Z del plano de fondo. Cambiar a -5 si quieres más profundidad.
  const CAMERA_Z = 0; // Posición Z de la cámara

  // --- Funciones de Utilidad y Inicialización ---
  const createTransparentRenderer = (
    canvas: HTMLCanvasElement,
  ): WebGLRenderer => {
    return new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
  };

  async function handleCapture() {
    // 🔴 Uso directo de la función externa
    const result = await captureBackground(
      backgroundContentRef,
      threlteCanvas,
      isSuspended,
      contentRef,
    );

    if (result) {
      capturedCanvas = result.canvas;
    }
  }

  let isCapturing = false;
  const CAPTURE_THROTTLE_MS = 200;

  const handleEvents = async () => {
    if (captureStrategy !== "html") return; // Agregar condición de estrategia

    isCapturing = true;

    await handleCapture();

    setTimeout(() => {
      isCapturing = false;
    }, CAPTURE_THROTTLE_MS);
  };

  $: if (canvasLayerRef && !threlteCanvas) {
    const threlteDiv = canvasLayerRef.firstChild;

    if (threlteDiv && threlteDiv.firstChild instanceof HTMLCanvasElement) {
      threlteCanvas = threlteDiv.firstChild;

      handleEvents(); // Iniciar la primera captura
      if (canRenderOnScroll) {
        window.addEventListener("scroll", handleEvents);
      }
      if (canRenderOnResize) {
        window.addEventListener("resize", handleEvents);
      }
    }
  }

  $: if (capturedCanvas && backgroundMesh && captureStrategy === "html") {
    const newTexture = updateThreeJsPlane(
      capturedCanvas,
      backgroundMesh,
      backgroundTexture as THREE.CanvasTexture | undefined,
      CAMERA_FOV,
      CAMERA_Z,
      BACKGROUND_Z,
    );
    backgroundTexture = newTexture;
  }
  let zoom = CAMERA_FOV;
  let mouseMagnitude: number = 0;
  const handleMouseMove = (event: any) => {
    if (!lookAt) return;
    if (!containerRef) return;

    const rect = containerRef.getBoundingClientRect();
    // Normalizar las coordenadas del mouse a un rango de [-1, 1]
    // Normalizar las coordenadas del mouse a un rango de [-1, 1]
    mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    // Invertimos Y para que mover el mouse hacia arriba rote el cubo hacia arriba
    mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    const mouseDistance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);

    // Normalizar la distancia al rango [0, 1]
    mouseMagnitude = Math.min(mouseDistance / 1.414, 1.0);

    console.log("mouseMagnitude", mouseMagnitude);
    zoom = CAMERA_FOV * 1.96;
  };

  const handleMouseOut = () => {
    if (!lookAt) return;
    if (!containerRef) return;
    if (mouseX !== 0 || mouseY !== 0) {
      mouseX = 0;
      mouseY = 0;
      //  zoom = CAMERA_FOV;
    }
  };
  onMount(() => {
    return () => {
      if (canRenderOnScroll) {
        window.removeEventListener("scroll", handleEvents);
      }
      if (canRenderOnResize) {
        window.removeEventListener("resize", handleEvents);
      }
      if (backgroundTexture) backgroundTexture.dispose();
    };
  });

  const CONFIG_THREE_COMPONENTS = {
    Mesh: {
      position: [0, 0, BACKGROUND_Z],
    },
    AmbientLight: {
      intensity: 0.9,
    },
    DirectionalLight: {
      intensity: 1.5,
      position: [1, 1, 1],
    },
    PerspectiveCamera: {
      position: [0, 0, 5],
      fov: CAMERA_FOV,
    },
    PlaneGeometry: {
      args: [1, 1],
    },
  };
</script>

<div
  class="glass-box-container"
  style="border-radius: var(--border-radius-container-glass-box)"
  on:mousemove={handleMouseMove}
  on:mouseout={handleMouseOut}
  role="contentinfo"
  bind:this={containerRef}
>
  <div class="background-content" bind:this={backgroundContentRef}></div>

  {#if !isSuspended}
    <div class="canvas-layer" bind:this={canvasLayerRef}>
      <Canvas createRenderer={createTransparentRenderer}>
        <T.PerspectiveCamera
          position={CONFIG_THREE_COMPONENTS.PerspectiveCamera.position as any}
          fov={CAMERA_FOV}
          makeDefault={true}
        />
        <T.AmbientLight
          intensity={CONFIG_THREE_COMPONENTS.AmbientLight.intensity}
        />
        <T.DirectionalLight
          position={CONFIG_THREE_COMPONENTS.DirectionalLight.position as any}
          intensity={CONFIG_THREE_COMPONENTS.DirectionalLight.intensity}
        />

        <T.Mesh
          bind:ref={backgroundMesh}
          position={CONFIG_THREE_COMPONENTS.Mesh.position as any}
        >
          <T.PlaneGeometry args={CONFIG_THREE_COMPONENTS.PlaneGeometry.args} />
          <T.MeshBasicMaterial />
        </T.Mesh>

        <AnimatedBox
          bind:meshReference={activeMesh}
          bind:width3D
          bind:height3D
          {mouseX}
          {mouseMagnitude}
          {mouseY}
          {SENSITIVITY}
        />

        {#if activeMesh && backgroundMesh}
          <GlassBoxLogic
            bind:backgroundTexture
            bind:renderTarget
            {activeMesh}
            {distortion}
            {backgroundMesh}
            {captureStrategy}
            {CAMERA_FOV}
            {BACKGROUND_Z}
            {CAMERA_Z}
            {mouseMagnitude}
            bind:width3D
            bind:height3D
          />
        {/if}
        {#if debug}
          <TextureDebugPlane {backgroundTexture} scale={2.5} {CAMERA_FOV} />
        {/if}
      </Canvas>
    </div>
  {/if}

  {#if capturedImageURL && debug}
    <img
      src={capturedImageURL}
      alt="Debug Capture"
      style="position: fixed; bottom: 10px; left: 10px; z-index: 99999; border: 5px solid red; background: white;width: 200px; height: 150px; object-fit: contain;"
    />
  {/if}
  <div class={`content-layer ${className}`} bind:this={contentRef} {style}>
    <slot />
  </div>
</div>

<style>
  .glass-box-container {
    --border-radius-container-glass-box: calc(var(--size) * 2);
    --border-container-glass-box: var(--glass-border);
    --blur-glass: var(--blur);
    position: relative;
    overflow: hidden;
    user-select: none;
    border: 2px solid var(--border-container-glass-box);
  }

  .background-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent !important; /* CRÍTICO: Debe ser transparente */
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    user-select: none;
  }

  .canvas-layer {
    position: absolute;
    /*
    top: 50%;
    left: 50%;
    width: calc(100% + 10%);
    height: calc(100% + 10%);
    transform: translate(-50%, -50%);
*/
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;

    z-index: 4;
    user-select: none;
  }

  .content-layer {
    /* Esta capa define el tamaño y posición final del 'GlassBox' en el DOM */
    position: relative;
    width: auto;
    height: auto;
    z-index: 12;
    padding: 20px;
    overflow: hidden;
    /* Estilos Glassmorphism */
    /*
    backdrop-filter: blur(var(--blur-glass)) saturate(110%);
    filter: var(--glass-shadow);
    background-color: var(--glass-surface);
  */
  }
</style>
