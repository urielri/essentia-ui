<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import type { Mesh } from "three";
  export let activeMesh: Mesh | undefined = undefined;
  export let mouseX: number = 0;
  export let mouseY: number = 0;
  export let SENSITIVITY: number = 0.2;
  export let mouseMagnitude: number = 0;
  export let width3D: number = 1;
  export let height3D: number = 1;

  const THICKNESS_Z = 0.1;

  useTask(() => {
    if (activeMesh) {
      activeMesh.rotation.y = mouseX * SENSITIVITY; // <-- Use standard lookAt-like rotation
      activeMesh.rotation.x = mouseY * SENSITIVITY; // <-- Use standard lookAt-like rotation

      activeMesh.position.x = mouseX * SENSITIVITY; // <-- Use standard lookAt-like rotation
      activeMesh.position.y = mouseY * SENSITIVITY; // <-- Use standard lookAt-like rotation

      const MAX_COMPENSATION_FACTOR = 0.05;
      const currentCompensation =
        1.0 + mouseMagnitude * MAX_COMPENSATION_FACTOR;
      activeMesh.scale.set(
        width3D * currentCompensation,
        height3D * currentCompensation,
        1.0,
      );
    }
  });
</script>

<T.Mesh bind:ref={activeMesh}>
  <T.BoxGeometry args={[1, 1, THICKNESS_Z]} />
  <T.MeshBasicMaterial transparent={true} opacity={0} />
</T.Mesh>
