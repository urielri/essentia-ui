<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core";
  import type { CanvasTexture, Mesh, Texture, WebGLRenderTarget } from "three";
  import * as THREE from "three";
  import GlassPlane from "./glass-plane.svelte";
  import { onMount } from "svelte";

  export let CAMERA_FOV: number;
  export let BACKGROUND_Z: number;
  export let CAMERA_Z: number;

  export let activeMesh: Mesh;
  export let backgroundMesh: Mesh;
  export let backgroundTexture: CanvasTexture | Texture | undefined;
  export let captureStrategy: "html" | "3d";
  export let distortion: number;
  export let mouseMagnitude: number;

  export let renderTarget: WebGLRenderTarget | null = null;

  export let width3D: number = 1;
  export let height3D: number = 1;

  export let dpr: number = 1;
  export let cssWidth: number = 1;
  export let cssHeight: number = 1;

  export let glassMesh: Mesh | undefined = undefined;

  export let uBoxNormalizedSize: THREE.Vector2 = new THREE.Vector2(2.0, 2.0);

  export let normalRenderTarget: THREE.WebGLRenderTarget | null = null;

  let depthMaterial = new THREE.MeshDepthMaterial();
  let normalMaterial = new THREE.MeshNormalMaterial();
  let staticDepthMesh: THREE.Mesh;
  // 1. FACTOR DE COBERTURA: Hace la malla 5% más grande para evitar huecos negros
  const COVERAGE_FACTOR = 1.05;

  // 2. FACTOR DE BORDE: Define dónde se dibuja la línea blanca (95% del viewport)
  const BORDER_INSET = 0.95;

  const { invalidate, camera, renderer, scene } = useThrelte();

  $: distanceToBackground = Math.abs(
    (camera.current?.position.z ?? CAMERA_Z) - BACKGROUND_Z,
  );

  $: {
    //const aspect = $size.width / $size.height;
    const aspect = (cssWidth / cssHeight) * COVERAGE_FACTOR;
    const visibleHeight =
      2 *
      distanceToBackground *
      Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    height3D = visibleHeight;
    width3D = visibleHeight * aspect;

    if (backgroundMesh) {
      backgroundMesh.scale.set(width3D, height3D, 1);
      activeMesh.scale.set(width3D, height3D, 1);
    }

    //    uBoxNormalizedSize.set(width3D, height3D);
    //uBoxNormalizedSize.set(aspect, 1.0);

    uBoxNormalizedSize.set(aspect * BORDER_INSET, BORDER_INSET);
    //    uBoxNormalizedSize.set(1.0, 1.0);
  }

  $: if (cssWidth > 0 && cssHeight > 0) {
    if (captureStrategy === "3d") {
      // Usar dimensiones en píxeles físicos para los render targets
      const rtWidth = Math.floor(cssWidth * dpr);
      const rtHeight = Math.floor(cssHeight * dpr);

      if (!renderTarget) {
        renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
        });
      } else {
        renderTarget.setSize(rtWidth, rtHeight);
      }

      backgroundTexture = renderTarget.texture; // Asignar Textura del RT

      if (!normalRenderTarget) {
        normalRenderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
        });
      } else {
        normalRenderTarget.setSize(rtWidth, rtHeight);
      }
      invalidate();
    }
  }
  onMount(() => {
    staticDepthMesh = activeMesh.clone();
    staticDepthMesh.material = depthMaterial;
    staticDepthMesh.rotation.set(0, 0, 0);
    staticDepthMesh.visible = false;
    scene.add(staticDepthMesh);

    return () => {
      if (staticDepthMesh) {
        scene.remove(staticDepthMesh);
        staticDepthMesh.geometry.dispose();
      }
      if (renderTarget) renderTarget.dispose();
      if (normalRenderTarget) normalRenderTarget.dispose();
    };
  });

  useTask(() => {
    if (
      captureStrategy !== "3d" ||
      !renderer ||
      !scene ||
      !camera.current ||
      !activeMesh ||
      !normalRenderTarget ||
      !renderTarget ||
      !staticDepthMesh
    )
      return;
    // PASADA 1: Renderizar el fondo
    backgroundMesh.visible = true;
    activeMesh.visible = false;
    staticDepthMesh.visible = false;
    if (glassMesh) scene.remove(glassMesh);

    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(scene, camera.current);

    // PASADA 2: Renderizar normales
    staticDepthMesh.material = normalMaterial;

    staticDepthMesh.position.copy(activeMesh.position);
    staticDepthMesh.rotation.copy(activeMesh.rotation);
    staticDepthMesh.scale.copy(activeMesh.scale);
    staticDepthMesh.visible = true;

    staticDepthMesh.updateMatrix();
    staticDepthMesh.updateMatrixWorld(true);

    backgroundMesh.visible = false;
    activeMesh.visible = false;

    renderer.setRenderTarget(normalRenderTarget);
    renderer.clear();
    renderer.render(staticDepthMesh, camera.current);

    // RESTAURAR
    staticDepthMesh.visible = false;
    backgroundMesh.visible = true;
    if (glassMesh) scene.add(glassMesh);
    renderer.setRenderTarget(null);
    invalidate();
  });
</script>
