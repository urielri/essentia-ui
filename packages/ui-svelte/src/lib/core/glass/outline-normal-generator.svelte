<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core";
  import type { Mesh } from "three";
  import * as THREE from "three";
  import { onMount } from "svelte";

  export let activeMesh: Mesh;
  export let normalRenderTarget: THREE.WebGLRenderTarget | null = null;
  export let dpr: number = 1;
  export let cssWidth: number = 1;
  export let cssHeight: number = 1;

  let normalMaterial = new THREE.MeshNormalMaterial();
  let normalMesh: THREE.Mesh;

  const { invalidate, camera, renderer, scene } = useThrelte();

  $: if (cssWidth > 0 && cssHeight > 0) {
    const rtWidth = Math.floor(cssWidth * dpr);
    const rtHeight = Math.floor(cssHeight * dpr);

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

  onMount(() => {
    normalMesh = activeMesh.clone();
    normalMesh.material = normalMaterial;
    normalMesh.visible = false;
    scene.add(normalMesh);

    return () => {
      scene.remove(normalMesh);
      normalMesh.geometry.dispose();
      if (normalRenderTarget) normalRenderTarget.dispose();
    };
  });

  useTask(() => {
    if (
      !renderer ||
      !camera.current ||
      !activeMesh ||
      !normalRenderTarget ||
      !normalMesh
    )
      return;

    normalMesh.position.copy(activeMesh.position);
    normalMesh.rotation.copy(activeMesh.rotation);
    normalMesh.scale.copy(activeMesh.scale);
    normalMesh.visible = true;
    //normalMesh.updateMatrix();
    //normalMesh.updateMatrixWorld(true);

    const oldTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(normalRenderTarget);
    renderer.clear();
    renderer.render(normalMesh, camera.current);
    renderer.setRenderTarget(oldTarget);

    normalMesh.visible = false;
    invalidate();
  });
</script>
