<script lang="ts">
  import { T } from "@threlte/core";
  import * as THREE from "three";
  import type { Texture, Mesh } from "three";

  export let backgroundTexture: Texture | null | undefined;
  export let scale: number = 3.0; // Escala visual del plano de depuración
  export let CAMERA_FOV: number;
  // Las otras props (BACKGROUND_Z, backgroundMesh) ya no son necesarias.

  let debugMesh: Mesh | undefined;

  // Lógica para actualizar el mapa del material
  $: if (debugMesh && backgroundTexture) {
    const material = debugMesh.material as THREE.MeshBasicMaterial;
    material.map = backgroundTexture;
    material.needsUpdate = true;
  }
</script>

<T.PerspectiveCamera position={[0, 0, 3]} fov={CAMERA_FOV} makeDefault={true} />
<T.AmbientLight intensity={0.8} />

<T.Mesh
  bind:ref={debugMesh}
  position={[0, 0, 0]}
  rotation={[-Math.PI / 4, 0, 0]}
  scale={[scale, scale, scale]}
>
  <T.PlaneGeometry args={[1, 1]} />
  <T.MeshBasicMaterial
    map={backgroundTexture}
    side={THREE.DoubleSide}
    transparent={true}
    color={backgroundTexture ? 0xffffff : 0xff0000}
  />
</T.Mesh>
