<script lang="ts">
  import { useThrelte } from "@threlte/core";
  import type { CanvasTexture, Mesh, Texture, WebGLRenderTarget } from "three";
  import * as THREE from "three";
  import GlassPlane from "./glass-plane.svelte";

  export let CAMERA_FOV: number;
  export let BACKGROUND_Z: number;
  export let CAMERA_Z: number;

  // Props de las referencias y estado
  export let activeMesh: Mesh;
  export let backgroundMesh: Mesh; // Debe ser Mesh, no Mesh | undefined
  export let backgroundTexture: CanvasTexture | Texture | undefined;
  export let captureStrategy: "html" | "3d";
  export let distortion: number;

  export let mouseMagnitude: number;
  export let renderTarget: WebGLRenderTarget | null = null;

  export let width3D: number = 1;
  export let height3D: number = 1;

  const { size, invalidate, camera } = useThrelte();

  $: distanceToBackground = Math.abs(
    (camera.current?.position.z ?? CAMERA_Z) - BACKGROUND_Z,
  );

  $: {
    const aspect = $size.width / $size.height;
    // Altura visible en la posición del plano de fondo
    const visibleHeight =
      2 *
      distanceToBackground *
      Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    // Asignar y exportar
    height3D = visibleHeight;
    width3D = visibleHeight * aspect;

    // CRÍTICO: Escalar el backgroundMesh para que llene la vista
    if (backgroundMesh) {
      backgroundMesh.scale.set(width3D, height3D, 1);
    }
  }

  $: if ($size.width > 0 && $size.height > 0) {
    if (captureStrategy === "3d") {
      if (!renderTarget) {
        renderTarget = new THREE.WebGLRenderTarget($size.width, $size.height, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          depthTexture: new THREE.DepthTexture($size.width, $size.height),
        });
      } else {
        renderTarget.setSize($size.width, $size.height);
      }
      backgroundTexture = renderTarget.texture; // Asignar Textura del RT

      // 2. Redimensionar el plano 3D (misma lógica que antes)
      const aspectRatio = $size.width / $size.height;
      const planeDistance = Math.abs(BACKGROUND_Z - CAMERA_Z);
      const visibleHeight =
        2 * Math.tan(CAMERA_FOV * 0.5 * (Math.PI / 180)) * planeDistance;

      backgroundMesh.geometry.dispose();
      backgroundMesh.geometry = new THREE.PlaneGeometry(
        visibleHeight * aspectRatio,
        visibleHeight,
      );
      backgroundMesh.position.set(0, 0, BACKGROUND_Z);
      invalidate();
    } else {
      renderTarget = null; // Liberar RT
    }
  }
</script>

<GlassPlane
  {activeMesh}
  {distortion}
  {captureStrategy}
  {backgroundTexture}
  {renderTarget}
  {backgroundMesh}
  {mouseMagnitude}
/>
