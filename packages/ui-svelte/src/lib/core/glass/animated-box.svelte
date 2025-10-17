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

  // 1. VARIABLE INTERMEDIA (tipo any para evitar el error de SvelteComponent)
  // El objeto Three.js se asignará aquí
  let meshRef: any;

  // 2. PROPIEDAD EXPUESTA: El Mesh de Three.js
  export let meshReference: THREE.Mesh | undefined = undefined;

  /**
   * Función de actualización que GlassPlane invocará en cada cuadro.
   */
  export const update = (elapsed: number) => {
    if (meshRef) {
      // Usamos meshRef para las operaciones
      meshRef.rotation.x = elapsed * 0.5;
      meshRef.rotation.y = elapsed * 0.3;
    }
  };

  // 3. REACTIVIDAD: Cuando meshRef recibe el objeto, actualiza la prop expuesta.
  // Esto asegura que meshReference sea de tipo THREE.Mesh (ya que meshRef lo contiene).
  $: if (meshRef) {
    meshReference = meshRef as THREE.Mesh;
  }

  // Limpieza
  onDestroy(() => {
    geometry.dispose();
    material.dispose();
  });
</script>

<!-- @ts-ignore -->
<!-- Usamos bind:this para enlazar el objeto Three.js a meshRef -->
<T.Mesh bind:this={meshRef} {geometry} {material} />
