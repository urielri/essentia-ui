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

  export let glassMesh: Mesh | undefined = undefined;
  export let uMouseXN: number = 0.5;
  export let mouseX: number = 0;
  export let normalRenderTarget: THREE.WebGLRenderTarget | null = null;

  let depthMaterial = new THREE.MeshDepthMaterial();
  let normalMaterial = new THREE.MeshNormalMaterial();
  let staticDepthMesh: THREE.Mesh;

  const { size, invalidate, camera, renderer, scene } = useThrelte();
  const MOUSE_RANGE_X = 1.0;

  $: distanceToBackground = Math.abs(
    (camera.current?.position.z ?? CAMERA_Z) - BACKGROUND_Z,
  );

  $: {
    const aspect = $size.width / $size.height;
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
  }

  $: if ($size.width > 0 && $size.height > 0) {
    if (captureStrategy === "3d") {
      // ✅ Render target SIN depth texture
      if (!renderTarget) {
        renderTarget = new THREE.WebGLRenderTarget($size.width, $size.height, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
        });
      } else {
        renderTarget.setSize($size.width, $size.height);
      }

      // ✅ La textura se usa directamente
      backgroundTexture = renderTarget.texture;

      const glassMaterial = activeMesh.material as THREE.ShaderMaterial;
      if (
        glassMaterial &&
        glassMaterial.uniforms &&
        glassMaterial.uniforms.tBackground
      ) {
        glassMaterial.uniforms.tBackground.value = backgroundTexture;
      }

      backgroundMesh.position.set(0, 0, BACKGROUND_Z);

      if (!normalRenderTarget) {
        normalRenderTarget = new THREE.WebGLRenderTarget(
          $size.width,
          $size.height,
          {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
          },
        );
      } else {
        normalRenderTarget.setSize($size.width, $size.height);
      }

      invalidate();
    } else {
      renderTarget = null;
    }
  }

  $: {
    const clampedMouseX = Math.min(
      Math.max(mouseX, -MOUSE_RANGE_X),
      MOUSE_RANGE_X,
    );
    uMouseXN = (clampedMouseX + MOUSE_RANGE_X) / (2 * MOUSE_RANGE_X);
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
      // ✅ Limpiar recursos
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

    // ✅ PASADA 1: Renderizar el fondo OFF-SCREEN
    // La clave es que el glassMesh NO esté en la escena durante esta pasada
    backgroundMesh.visible = true;
    activeMesh.visible = false;
    staticDepthMesh.visible = false;
    if (glassMesh) scene.remove(glassMesh); // ⚠️ REMOVER temporalmente de la escena

    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(scene, camera.current);

    // ✅ PASADA 2: Renderizar normales
    staticDepthMesh.position.copy(activeMesh.position);
    staticDepthMesh.scale.copy(activeMesh.scale);
    staticDepthMesh.rotation.set(0, 0, 0);
    staticDepthMesh.material = normalMaterial;
    staticDepthMesh.visible = true;
    backgroundMesh.visible = false;

    renderer.setRenderTarget(normalRenderTarget);
    renderer.clear();
    renderer.render(staticDepthMesh, camera.current);

    // ✅ RESTAURAR para la pasada final (la escena principal)
    renderer.setRenderTarget(null);
    if (glassMesh) scene.add(glassMesh); // ⚠️ VOLVER a agregar a la escena
    staticDepthMesh.visible = false;
    backgroundMesh.visible = true;

    invalidate();
  });
</script>

<GlassPlane
  {distortion}
  {backgroundTexture}
  {mouseMagnitude}
  bind:glassMesh
  bind:activeMesh
/>
