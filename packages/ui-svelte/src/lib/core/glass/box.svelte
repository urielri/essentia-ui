<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import html2canvas from "html2canvas";
  import { onMount, tick } from "svelte";
  import * as THREE from "three";

  import type {
    CanvasTexture,
    Mesh,
    MeshBasicMaterial,
    WebGLRenderer,
  } from "three";
  import AnimatedBox from "./animated-box.svelte";
  import GlassPlane from "./glass-plane.svelte";
  export let isSuspended: boolean = false; // 👈 Nueva prop
  export let distortion: number = 1.0;
  export let className: string;
  let activeMesh: Mesh | undefined;
  let animatedBoxComponent: { update: (elapsed: number) => void } | undefined;
  // Referencias esenciales
  let backgroundContentRef: HTMLDivElement;
  let backgroundTexture: CanvasTexture | undefined;
  let backgroundMesh: Mesh | undefined;
  let canvasLayerRef: HTMLDivElement | undefined;
  // 🔴 CAMBIO: El tipo correcto debe ser HTMLCanvasElement
  let threlteCanvas: HTMLCanvasElement | undefined;

  // ESTADO DE DEPURACIÓN Y CAPTURA
  let capturedImageURL: string | null = null;
  let capturedCanvas: HTMLCanvasElement | undefined = undefined;

  // CONSTANTES 3D
  const CAMERA_FOV = 75;
  const BACKGROUND_Z = -10; // Posición Z del plano de fondo. Cambiar a -5 si quieres más profundidad.
  const CAMERA_Z = 5; // Posición Z de la cámara

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

  /**
   * 🔴 LÓGICA 1: CAPTURA DE HTML2CANVAS (Solo genera el Canvas 2D)
   */
  async function captureBackground() {
    if (isSuspended) return; // 👈 Saltar la captura si está suspendido
    // 🔴 CRÍTICO: Aseguramos que la referencia al canvas esté lista para ignorarla
    if (!backgroundContentRef) return;

    await tick();

    try {
      // 🔴 Se puede cambiar a document.body si backgroundContentRef sigue fallando.
      const rect = backgroundContentRef.getBoundingClientRect();
      const elementToCapture = document.body;
      const canvas = await html2canvas(elementToCapture, {
        useCORS: true,
        allowTaint: true,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        backgroundColor: null, // Asegura que no se fuerce un fondo blanco/gris
        removeContainer: true, // Por defecto es true, pero ayuda a la claridad
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
        ignoreElements: (element) => {
          return element === threlteCanvas;
        },
      });

      capturedCanvas = canvas;

      // Para DEPURACIÓN: Generar una URL para mostrar la imagen en el DOM
      capturedImageURL = canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error al capturar con html2canvas:", error);
    }
  }

  /**
   * 🔴 LÓGICA 2: SINCRONIZACIÓN Y REDIMENSIONAMIENTO DE THREE.JS
   */
  async function updateThreeJsPlane() {
    if (isSuspended) return;
    console.log("updateThreeJsPlane", {
      capturedCanvas,
      backgroundMesh,
      backgroundTexture,
    });
    if (!capturedCanvas || !backgroundMesh) return;
    // 1. Actualiza la textura de Three.js
    if (backgroundTexture) {
      backgroundTexture.image = capturedCanvas;
      backgroundTexture.needsUpdate = true;
    } else {
      backgroundTexture = new THREE.CanvasTexture(capturedCanvas);
      backgroundTexture.minFilter = THREE.LinearFilter;
      backgroundTexture.magFilter = THREE.LinearFilter;
    }

    // 2. Redimensionamiento del Plano 3D
    const { width: pixelWidth, height: pixelHeight } = capturedCanvas;
    const aspectRatio = pixelWidth / pixelHeight;
    console.log("aspectRatio", aspectRatio);
    // Distancia real entre la cámara y el plano de fondo
    const planeDistance = Math.abs(BACKGROUND_Z - CAMERA_Z);
    // Altura visible a esa distancia (fórmula matemática para llenar el frustum)
    const visibleHeight =
      2 * Math.tan(CAMERA_FOV * 0.5 * (Math.PI / 180)) * planeDistance;
    const planeHeight = visibleHeight;
    const planeWidth = planeHeight * aspectRatio;

    console.log({
      planeDistance,
      visibleHeight,
      planeHeight,
      planeWidth,
    });
    // Recrear la geometría
    backgroundMesh.geometry.dispose();
    backgroundMesh.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    // Asignación de la textura
    const material = backgroundMesh.material as MeshBasicMaterial;
    material.map = backgroundTexture;
    material.needsUpdate = true;
    backgroundMesh.position.set(0, 0, BACKGROUND_Z);
    backgroundMesh.visible = true; // Mostrar el plano de fondo
  }

  // --- Lógica de Eventos y Reactividad ---

  let isCapturing = false;
  const CAPTURE_THROTTLE_MS = 200;

  const handleEvents = async () => {
    if (isCapturing) return;

    isCapturing = true;

    // Ocultar el mesh ANTES de la captura
    if (backgroundMesh) backgroundMesh.visible = false;

    await captureBackground();

    setTimeout(() => {
      isCapturing = false;
    }, CAPTURE_THROTTLE_MS);
  };

  $: if (canvasLayerRef && !threlteCanvas) {
    const threlteDiv = canvasLayerRef.firstChild;

    if (threlteDiv && threlteDiv.firstChild instanceof HTMLCanvasElement) {
      threlteCanvas = threlteDiv.firstChild;

      handleEvents(); // Iniciar la primera captura
      window.addEventListener("scroll", handleEvents);
      window.addEventListener("resize", handleEvents);
    }
  }

  $: if (capturedCanvas && backgroundMesh) {
    // Se ejecuta CADA VEZ que capturedCanvas se actualiza
    updateThreeJsPlane();
  }

  onMount(() => {
    /*

    console.log("onMount", {
      backgroundContentRef,
      backgroundMesh,
      backgroundTexture,
    });
    */
    return () => {
      window.removeEventListener("scroll", handleEvents);
      window.removeEventListener("resize", handleEvents);

      if (backgroundTexture) backgroundTexture.dispose();
    };
  });
</script>

<div class="glass-box-container">
  <div class="background-content" bind:this={backgroundContentRef}></div>

  {#if !isSuspended}
    <div class="canvas-layer" bind:this={canvasLayerRef}>
      <Canvas createRenderer={createTransparentRenderer}>
        <T.PerspectiveCamera position={[0, 0, 5]} fov={CAMERA_FOV} />
        <T.AmbientLight intensity={0.5} />
        <T.DirectionalLight position={[1, 1, 1]} intensity={1.5} />

        <T.Mesh bind:ref={backgroundMesh} position={[0, 0, BACKGROUND_Z]}>
          <T.PlaneGeometry args={[1, 1]} />
          <T.MeshBasicMaterial map={backgroundTexture} />
        </T.Mesh>

        <AnimatedBox bind:meshReference={activeMesh} />

        {#if activeMesh && backgroundMesh}
          <GlassPlane
            {activeMesh}
            {distortion}
            {backgroundMesh}
            {animatedBoxComponent}
            {isSuspended}
          />
        {/if}
      </Canvas>
    </div>
  {/if}
  {#if capturedImageURL}
    <img
      src={capturedImageURL}
      alt="Debug Capture"
      style="position: fixed; bottom: 10px; left: 10px; z-index: 99999; border: 5px solid red; width: 200px; height: 150px; object-fit: cover;"
    />
  {/if}

  <div class={`content-layer ${className}`}>
    <slot />
  </div>
</div>

<style>
  .glass-box-container {
    position: relative;
  }

  .background-content {
    /* 🔴 CRÍTICO: Posicionamiento para capturar el fondo de la ventana */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent !important; /* CRÍTICO: Debe ser transparente */
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 4;
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
    /*  backdrop-filter: blur(10px) saturate(180%); */
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 15px;
  }
</style>
