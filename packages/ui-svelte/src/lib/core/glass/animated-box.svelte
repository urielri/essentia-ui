<script lang="ts">
  import { onDestroy } from "svelte";
  import { T, useTask } from "@threlte/core";
  import * as THREE from "three";
  import type { Mesh } from "three";

  const geometry = new THREE.BoxGeometry(3, 3, 3);
  const material = new THREE.MeshNormalMaterial({
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });

  let meshRef: Mesh | undefined = undefined;
  export let meshReference: Mesh | undefined = undefined;

  // 🔴 1. Implementar useTask para la animación del cubo
  const { start, stop } = useTask((delta) => {
    // delta es el tiempo transcurrido desde el último frame, ideal para rotación fluida
    if (meshRef) {
      // Rotar usando delta (más preciso para animaciones independientes del framerate)
      // Si quieres la rotación basada en el tiempo total (elapsed), usa el tiempo total
      // de la tarea o la función runRefractionPass.
      meshRef.rotation.x += delta * 0.5;
      meshRef.rotation.y += delta * 0.3;
    }
    // Dejar que useTask maneje el autoInvalidate (comportamiento por defecto)
  });

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
