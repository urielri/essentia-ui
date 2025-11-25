<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core";
  import type { CanvasTexture, Mesh, Texture, WebGLRenderTarget } from "three";
  import * as THREE from "three";
  import GlassPlane from "./glass-plane.svelte";
  import { setupRenderTarget } from "./html2canvas-logic";
  import { onMount } from "svelte";

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

  export let glassMesh: Mesh | undefined = undefined;

  export let uLeftBorderFalloff: number = 0.1; // Extensión del degradé (0.0 a 0.5)
  export let uRightBorderFalloff: number = 0.1;
  export let uTopBorderFalloff: number = 0.1;
  export let uBottomBorderFalloff: number = 0.1;
  export let uMouseXN: number = 0.5; // 🟢 NUEVO EXPORT PARA EL SHADER
  export let mouseX: number = 0;
  export let outlineRenderTarget: THREE.WebGLRenderTarget | null = null;
  let depthMaterial = new THREE.MeshDepthMaterial();
  let staticDepthMesh: THREE.Mesh;
  let outlineScale = new THREE.Vector3(1, 1, 1);

  const { size, invalidate, camera, renderer, scene } = useThrelte();

  const MOUSE_RANGE_X = 1.0;

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
    /*
    height3D = visibleHeight * 1.05;
    width3D = visibleHeight * aspect * 1.05;
    */
    height3D = visibleHeight;
    width3D = visibleHeight * aspect;

    // CRÍTICO: Escalar el backgroundMesh para que llene la vista
    if (backgroundMesh) {
      backgroundMesh.scale.set(width3D, height3D, 1);
      activeMesh.scale.set(width3D, height3D, 1);
    }
    const OUTLINE_OVERSIZE_FACTOR = 0.5; // Asegura que el molde sea 2% más grande
    outlineScale.y = visibleHeight * 0.491;
    outlineScale.x = visibleHeight * aspect * 0.492;
    outlineScale.z = 1.2; // Profundidad fina
  }

  $: if ($size.width > 0 && $size.height > 0) {
    if (captureStrategy === "3d") {
      renderTarget = setupRenderTarget($size.width, $size.height, renderTarget);
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

      const glassMaterial = activeMesh.material as THREE.ShaderMaterial;
      if (
        glassMaterial &&
        glassMaterial.uniforms &&
        glassMaterial.uniforms.tBackground
      ) {
        glassMaterial.uniforms.tBackground.value = backgroundTexture;
      }
      backgroundMesh.position.set(0, 0, BACKGROUND_Z);
      invalidate();
    } else {
      renderTarget = null; // Liberar RT
    }
  }

  const BASE_FALLOFF = 0.1;
  const SENSITIVITY_FALLOFF = 0.5; // Usamos un nombre distinto a la SENSITIVITY del animated-box
  const MAX_FALLOFF = 0.3;

  $: {
    // ... (tu lógica de visibleHeight, width3D, etc.)

    if (activeMesh) {
      // 🟢 LEER DIRECTAMENTE LA POSICIÓN 3D FINAL DEL OBJETO
      const currentX = activeMesh.position.x;
      const currentY = activeMesh.position.y;

      // --- CÁLCULO DEL FALLOFF ---

      // Borde Izquierdo: Crece con X negativo (movimiento a la izquierda)
      const leftMod = -currentX * SENSITIVITY_FALLOFF;
      uLeftBorderFalloff = BASE_FALLOFF + Math.max(0, leftMod);

      // Borde Derecho: Crece con X positivo (movimiento a la derecha)
      const rightMod = currentX * SENSITIVITY_FALLOFF;
      uRightBorderFalloff = BASE_FALLOFF + Math.max(0, rightMod);

      // Borde Inferior: Crece con Y negativo (movimiento hacia abajo)
      const bottomMod = -currentY * SENSITIVITY_FALLOFF;
      uBottomBorderFalloff = BASE_FALLOFF + Math.max(0, bottomMod);

      // Borde Superior: Crece con Y positivo (movimiento hacia arriba)
      const topMod = currentY * SENSITIVITY_FALLOFF;
      uTopBorderFalloff = BASE_FALLOFF + Math.max(0, topMod);

      const clampedMouseX = Math.min(
        Math.max(mouseX, -MOUSE_RANGE_X),
        MOUSE_RANGE_X,
      );

      // Mapeo lineal: (valor + rango) / (2 * rango)
      uMouseXN = (clampedMouseX + MOUSE_RANGE_X) / (2 * MOUSE_RANGE_X);

      invalidate();
    }
  }

  onMount(() => {
    // Creamos el molde de profundidad estático a partir del activeMesh
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
    };
  });

  // 🔄 BUCLE DE RENDERIZADO (Pasadas Auxiliares)
  useTask(() => {
    if (
      captureStrategy !== "3d" ||
      !renderer ||
      !scene ||
      !camera.current ||
      !activeMesh ||
      !outlineRenderTarget ||
      !renderTarget ||
      !staticDepthMesh
    )
      return;

    // A. PASADA 1: Renderizar el Fondo (BackgroundMesh) al RenderTarget principal
    backgroundMesh.visible = true;
    activeMesh.visible = false;
    staticDepthMesh.visible = false;
    if (glassMesh) scene.remove(glassMesh);

    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(scene, camera.current);

    // B. PASADA 2: Renderizar el objeto de borde (MOLDE ESTÁTICO) a RenderTarget de Profundidad

    // 1. Sincronizar posición y escala (sin rotación)
    staticDepthMesh.position.set(
      activeMesh.position.x * 0.001,
      activeMesh.position.y * 0.001,
      -activeMesh.position.z,
    );
    // staticDepthMesh.scale.set(2, 3, 0);
    staticDepthMesh.scale.copy(outlineScale);
    //staticDepthMesh.rotation.copy(activeMesh.rotation);
    // 2. Configurar visibilidad para la captura
    backgroundMesh.visible = false;
    staticDepthMesh.visible = true;

    // 3. Renderizar Profundidad
    renderer.setRenderTarget(outlineRenderTarget);
    renderer.clear();
    renderer.render(staticDepthMesh, camera.current);

    // C. RESTAURACIÓN Y PREPARACIÓN PARA LA PASADA FINAL DE THRELTE
    if (glassMesh) scene.add(glassMesh);
    staticDepthMesh.visible = false;
    backgroundMesh.visible = true;
    renderer.setRenderTarget(null);
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
