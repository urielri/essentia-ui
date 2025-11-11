<script lang="ts">
  import { onDestroy } from "svelte";
  import { T, useTask } from "@threlte/core";
  import * as THREE from "three";
  import type { Mesh } from "three";

  //const geometry = new THREE.BoxGeometry(1, 1, 0.1);
  const material = new THREE.MeshNormalMaterial({
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });

  let meshRef: Mesh | undefined = undefined;
  let geometry: THREE.BufferGeometry | undefined = undefined;
  export let meshReference: Mesh | undefined = undefined;
  export let mouseX: number = 0;
  export let mouseY: number = 0;
  export let SENSITIVITY: number = 0.4;
  export let mouseMagnitude: number = 0;
  export let width3D: number = 1;
  export let height3D: number = 1;

  $: if (width3D > 0 && height3D > 0) {
    if (geometry) geometry.dispose();

    // Creamos la caja con las dimensiones 3D correctas. Usamos un Z pequeño.
    geometry = new THREE.BoxGeometry(width3D, height3D, 0.1);

    if (meshRef) {
      meshRef.geometry = geometry;
      // 🔴 CRÍTICO: El cubo ya tiene la escala correcta, la escala base debe ser 1
      meshRef.scale.set(1, 1, 1);
    }
  }
  useTask(() => {
    const mouseDistance = Math.sqrt(mouseX * mouseX + mouseY * mouseY); // Rango [0, ~1.41]
    const MIN_SCALE = 1.0;
    const MAX_SCALE_ZOOM = 1.15; // Solo 5% de zoom extra
    const currentScale =
      MIN_SCALE + (mouseDistance / 1.414) * (MAX_SCALE_ZOOM - MIN_SCALE);
    if (meshRef) {
      meshRef.rotation.x = mouseY * SENSITIVITY;
      meshRef.rotation.y = mouseX * SENSITIVITY;
      //  meshRef.position.x = mouseX * SENSITIVITY;
      // meshRef.position.y = mouseY * SENSITIVITY;
      //meshRef.scale.set(COMPENSATION_FACTOR, COMPENSATION_FACTOR, 1.0);
      //      meshRef.scale.set(currentScale, currentScale, 1.0);
      const MAX_COMPENSATION_FACTOR = 1.05;
      const currentCompensation =
        1.0 + mouseMagnitude * MAX_COMPENSATION_FACTOR;

      // 3. Aplicar al cubo (activeMesh)
      // Ya que la geometría usa width3D/height3D, solo escalamos los ejes X e Y
      meshRef.scale.set(
        currentCompensation,
        currentCompensation,
        1.0, // Z siempre debe ser 1 (o el valor que uses para el grosor)
      );
    }
  });

  $: if (meshRef) {
    meshReference = meshRef;
  }

  // Limpieza
  onDestroy(() => {
    geometry?.dispose();
    material.dispose();
  });
</script>

<T.Mesh bind:ref={meshRef} {geometry} {material}>
  <T.BoxGeometry args={[1, 1, 0.1]} />
  <T.MeshBasicMaterial transparent={true} opacity={0} />
</T.Mesh>
