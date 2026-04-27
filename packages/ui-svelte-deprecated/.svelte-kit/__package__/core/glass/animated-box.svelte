<script lang="ts">
  import { onDestroy } from "svelte";
  import * as THREE from "three";
  import { T } from "@threlte/core";

  const geometry = new THREE.BoxGeometry(3, 3, 3);
  const material = new THREE.MeshNormalMaterial({
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });

  // Referencia al mesh de Three.js
  let meshRef: THREE.Mesh | undefined = undefined;

  // Propiedad expuesta
  export let meshReference: THREE.Mesh | undefined = undefined;

  /**
   * Función de actualización que GlassPlane invocará en cada cuadro.
   */
  export const update = (elapsed: number) => {
    if (meshRef) {
      meshRef.rotation.x = elapsed * 0.5;
      meshRef.rotation.y = elapsed * 0.3;
    }
  };

  // Reactividad: actualiza meshReference cuando meshRef cambia
  $: if (meshRef) {
    meshReference = meshRef;
  }

  // Limpieza
  onDestroy(() => {
    geometry.dispose();
    material.dispose();
  });
</script>

<T.Mesh bind:ref={meshRef} {geometry} {material} />
