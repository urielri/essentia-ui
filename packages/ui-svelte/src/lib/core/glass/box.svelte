<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import { onMount } from "svelte";
  import type { CanvasTexture, Mesh, WebGLRenderer } from "three";
  import * as THREE from "three";
  import AnimatedBox from "./animated-box.svelte";
  import GlassBoxLogic from "./box-logic.svelte";
  import { captureBackground } from "./html2canvas-logic";
  import TextureDebugPlane from "./texture-debug-plane.svelte";
  import { noiseVertexShader, noiseFragmentShader } from "./shaders";
  import NoisePoints from "./noise-points.svelte";
  import OutlineEffect from "./outline-effect.svelte";

  export let isSuspended: boolean = false;
  export let captureStrategy: "html" | "3d" = "3d";
  export let distortion: number = 9.0;
  export let className: string = "";
  export let style: string = "";
  export let debug: boolean = false;

  export let mouseX = 0;
  export let mouseY = 0;

  export let uLeftBorderFalloff: number = 0.1; // Extensión del degradé (0.0 a 0.5)
  export let uRightBorderFalloff: number = 0.1;
  export let uTopBorderFalloff: number = 0.1;
  export let uBottomBorderFalloff: number = 0.1;
  export let uMouseXN: number = 0.5; // 🟢 NUEVO EXPORT PARA EL SHADER

  const MAX_TILT_DEG = 2;
  let tiltX = 0;
  let tiltY = 0;

  export let lookAt: boolean = true;
  export let canRenderOnScroll: boolean = false;
  export let canRenderOnResize: boolean = false;

  export const SENSITIVITY = 0.1;

  let width3D: number = 1;
  let height3D: number = 1;

  let noiseScale = new THREE.Vector3(1, 1, 1);

  $: noiseScale.set(width3D || 1, height3D || 1, 1);

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

  let outlineRenderTarget: THREE.WebGLRenderTarget | null = null;

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

  // SOLO EN ESTRATEGIA HTML
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
    if (backgroundMesh) {
      backgroundMesh.visible = false;
      /*
      if (!backgroundTexture) {
        createFixedImageTexture(NOISE_TEXTURE_URL)
          .then((newTexture) => {
            backgroundTexture = newTexture;

            // Asignar al material del backgroundMesh y ocultar
            const material = backgroundMesh!
              .material as THREE.MeshBasicMaterial;
            if (material) {
              material.map = newTexture;
              material.needsUpdate = true;
            }
            // Asegúrate de que el backgroundMesh esté oculto o manejado por el GlassMesh
            backgroundMesh!.visible = false;
          })
          .catch(console.error);
      }
    */
    }
    /*
    const newTexture = updateThreeJsPlane(
      capturedCanvas,
      backgroundMesh,
      backgroundTexture as THREE.CanvasTexture | undefined,
      CAMERA_FOV,
      CAMERA_Z,
      BACKGROUND_Z,
    );
    newTexture.wrapS = THREE.ClampToEdgeWrapping;
    newTexture.wrapT = THREE.ClampToEdgeWrapping;
    backgroundTexture = newTexture;
    // backgroundTexture = createColorTexture("#ADD8E6", 0.01);

    //backgroundTexture = createGradientTexture();
    */
  }

  $: {
    if (threlteCanvas && !outlineRenderTarget) {
      outlineRenderTarget = new THREE.WebGLRenderTarget(
        threlteCanvas.width,
        threlteCanvas.height,
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          depthBuffer: true, // ¡CRÍTICO! Necesitamos el depth buffer
        },
      );
    }
    // Asegúrate de actualizar el tamaño si el canvas cambia
    if (outlineRenderTarget && threlteCanvas) {
      outlineRenderTarget.setSize(threlteCanvas.width, threlteCanvas.height);
    }
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
  style={`border-radius: var(--border-radius-container-glass-box);--tiltX: ${tiltX}deg;--tiltY: ${tiltY}deg;`}
  on:mousemove={handleMouseMove}
  on:mouseout={handleMouseOut}
  on:blur={handleMouseOut}
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
          transparent={true}
        >
          <T.MeshBasicMaterial transparent={true} />
          <NoisePoints
            {noiseVertexShader}
            {noiseFragmentShader}
            bind:width3D
            bind:height3D
            {mouseX}
            {mouseY}
            {mouseMagnitude}
          />
        </T.Mesh>

        <AnimatedBox
          bind:activeMesh
          bind:width3D
          bind:height3D
          {mouseX}
          {mouseMagnitude}
          {mouseY}
          {SENSITIVITY}
        />
        <OutlineEffect
          bind:outlineRenderTarget
          uOutlineColor={new THREE.Vector3(1.0, 1.0, 1.0)}
          uResolution={new THREE.Vector2(
            threlteCanvas?.width,
            threlteCanvas?.height,
          )}
          {mouseMagnitude}
          {uMouseXN}
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
            {mouseX}
            {uMouseXN}
            bind:outlineRenderTarget
            bind:width3D
            bind:height3D
            bind:uLeftBorderFalloff
            bind:uRightBorderFalloff
            bind:uTopBorderFalloff
            bind:uBottomBorderFalloff
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
*/
    /* background-color: var(--glass-surface);*/
  }
</style>
