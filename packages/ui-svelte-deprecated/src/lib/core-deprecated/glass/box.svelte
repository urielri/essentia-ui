<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import { onMount } from "svelte";
  import type { CanvasTexture, Mesh, WebGLRenderer } from "three";
  import * as THREE from "three";
  import AnimatedBox from "./animated-box.svelte";
  import BlurEffect from "./blur-effect.svelte";
  import GlassBoxLogic from "./box-logic.svelte";
  import NoisePoints from "./noise-points.svelte";
  import OutlineEffect from "./outline-effect.svelte";
  import { noiseFragmentShader, noiseVertexShader } from "./shaders";
  import TextureDebugPlane from "./texture-debug-plane.svelte";
  import OutlineNormalGenerator from "./outline-normal-generator.svelte";
  export let isSuspended: boolean = false;
  export let captureStrategy: "html" | "3d" = "3d";
  export let distortion: number = 9.0;
  export let className: string = "";
  export let style: string = "";
  export let debug: boolean = false;

  export let mouseX = 0;
  export let mouseY = 0;

  let uBoxNormalizedSize: THREE.Vector2 = new THREE.Vector2(2.0, 2.0);
  export let lookAt: boolean = true;
  export let canRenderOnScroll: boolean = false;
  export let canRenderOnResize: boolean = false;

  export let SENSITIVITY = 0.0;

  // Ajuste para el zoom del navegador
  let dpr = 1;
  let cssWidth = 1;
  let cssHeight = 1;

  let blurEnabled = true;
  let blurIntensity = 3.2;

  const MAX_TILT_DEG = 0.3;
  let tiltX = 0;
  let tiltY = 0;
  let normalizedBorderRadius = 0.15; // Valor por defecto
  let width3D: number = 1;
  let height3D: number = 1;

  let activeMesh: Mesh | undefined;

  let uFresnelPower: number = 0.5; // La dureza del brillo (más alto = más concentrado en el borde)
  let normalRenderTarget: THREE.WebGLRenderTarget | null = null;
  let backgroundContentRef: HTMLDivElement;

  let backgroundTexture: CanvasTexture | THREE.Texture | undefined;
  let backgroundMesh: Mesh | undefined;

  let canvasLayerRef: HTMLDivElement | undefined;
  let threlteCanvas: HTMLCanvasElement | undefined;
  let contentRef: HTMLDivElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  // ESTADO DE DEPURACIÓN Y CAPTURA

  let renderTarget: THREE.WebGLRenderTarget | null = null;
  // CONSTANTES 3D
  const CAMERA_FOV = 75;
  const BACKGROUND_Z = 0; // Posición Z del plano de fondo. Cambiar a -5 si quieres más profundidad.
  const CAMERA_Z = 0; // Posición Z de la cámara

  let noiseScale = new THREE.Vector3(1, 1, 1);

  $: noiseScale.set(width3D || 1, height3D || 1, 1);

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

  const handleEvents = async () => {
    console.log("CAPTURED");
  };

  function updateDimensions() {
    if (!containerRef) return;

    const rect = containerRef.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    cssWidth = rect.width;
    cssHeight = rect.height;
  }

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

  $: if (containerRef) {
    const rect = containerRef.getBoundingClientRect();
    const computedStyle = getComputedStyle(containerRef);
    const radiusPx = parseFloat(computedStyle.borderRadius) || 0;

    // Normalizar: divide el radio en píxeles por la dimensión más pequeña
    const minDimension = Math.min(rect.width, rect.height);
    normalizedBorderRadius =
      minDimension > 0 ? (radiusPx / minDimension) * 2 : 0.15;
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
    //mouseMagnitude = Math.min(mouseDistance / 1.414, 1.0);
    //mouseMagnitude = (mouseX - mouseY) * 0.5; // Rango aprox [-1, +1]

    mouseMagnitude = Math.max(-1, Math.min(1, (mouseX - mouseY) * 0.5));

    const quadrantX = mouseX > 0 ? 1 : 0.5; // Derecha más fuerte
    const quadrantY = mouseY < 0 ? 1 : -1; // Arriba = +, Abajo = -

    // Intensidad basada en distancia al centro
    //const intensity = Math.max(Math.abs(mouseX), Math.abs(mouseY));

    //mouseMagnitude = quadrantY * quadrantX * intensity;
    // Clamp para asegurar rango
    //  mouseMagnitude = Math.max(-1, Math.min(1, mouseMagnitude));
    zoom = CAMERA_FOV * 1.96;
    tiltX = -mouseY * MAX_TILT_DEG;
    tiltY = mouseX * MAX_TILT_DEG;
  };

  const handleMouseOut = () => {
    if (!lookAt) return;
    if (!containerRef) return;
    if (mouseX !== 0 || mouseY !== 0) {
      mouseX = mouseX;
      mouseY = mouseY;
      tiltX = 0;
      tiltY = 0;
      //  zoom = CAMERA_FOV;
    }
  };

  onMount(() => {
    updateDimensions();
    // Escuchar cambios de zoom (se detecta como resize)
    window.addEventListener("resize", updateDimensions);

    // Detectar cambios de devicePixelRatio (zoom)
    const mediaQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`,
    );
    mediaQuery.addEventListener("change", updateDimensions);
    return () => {
      if (canRenderOnScroll) {
        window.removeEventListener("scroll", handleEvents);
      }
      if (canRenderOnResize) {
        window.removeEventListener("resize", handleEvents);
      }
      if (backgroundTexture) backgroundTexture.dispose();
      window.removeEventListener("resize", updateDimensions);
      mediaQuery.removeEventListener("change", updateDimensions);
    };
  });

  $: if (containerRef) {
    updateDimensions();
  }

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
  style={`border-radius: var(--border-radius-container-glass-box);--tiltX: ${tiltX}deg;--tiltY: ${tiltY}deg;`}
  on:mousemove={handleMouseMove}
  on:mouseout={handleMouseOut}
  on:blur={handleMouseOut}
  role="contentinfo"
  bind:this={containerRef}
>
  <div class="background-content" bind:this={backgroundContentRef}></div>

  {#if !isSuspended}
    <div class="canvas-layer main-layer" bind:this={canvasLayerRef}>
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
          transparent={true}
        >
          <T.MeshBasicMaterial transparent={true} />
          <NoisePoints
            {noiseVertexShader}
            {noiseFragmentShader}
            {width3D}
            {height3D}
            {mouseX}
            {mouseY}
            {mouseMagnitude}
            {cssWidth}
            {cssHeight}
          />
        </T.Mesh>

        <AnimatedBox
          bind:activeMesh
          {width3D}
          {height3D}
          {mouseX}
          {mouseY}
          {mouseMagnitude}
          {SENSITIVITY}
        />
        <OutlineEffect
          bind:normalRenderTarget
          uOutlineColor={new THREE.Vector3(1.0, 1.0, 1.0)}
          {uBoxNormalizedSize}
          {dpr}
          {cssWidth}
          {cssHeight}
          {mouseX}
          {mouseY}
          {mouseMagnitude}
        />

        {#if activeMesh && backgroundMesh}
          <GlassBoxLogic
            bind:backgroundTexture
            bind:renderTarget
            bind:uBoxNormalizedSize
            {activeMesh}
            {distortion}
            {backgroundMesh}
            {captureStrategy}
            {CAMERA_FOV}
            {BACKGROUND_Z}
            {CAMERA_Z}
            {mouseMagnitude}
            bind:normalRenderTarget
            bind:width3D
            bind:height3D
            {dpr}
            {cssWidth}
            {cssHeight}
          />
        {/if}
        {#if true}
          <BlurEffect enabled={blurEnabled} blurScale={blurIntensity} />
        {/if}
      </Canvas>
    </div>
  {/if}

  <div class={`content-layer ${className}`} bind:this={contentRef} {style}>
    <slot />
  </div>
</div>

<style>
  .main-layer,
  .overlay-layer {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .overlay-layer {
    pointer-events: none;
    z-index: 2;
  }
  .glass-box-container {
    --border-radius-container-glass-box: calc(var(--size) * 2);
    --border-container-glass-box: var(--glass-border);
    --blur-glass: var(--blur);
    position: relative;
    overflow: hidden;
    user-select: none;
    border: 1px solid var(--border-container-glass-box);
    transform: perspective(1000px) rotateX(var(--tiltX, 0deg))
      rotateY(var(--tiltY, 0deg));
    transition: transform 0.2s ease-out;
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

    /*
    backdrop-filter: blur(var(--blur-glass)) saturate(110%);
*/
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
    filter: var(--glass-shadow);
    /* background-color: var(--glass-surface);*/
  }
</style>
