<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import * as THREE from "three";

  // PROPS
  export let uScale: THREE.Vector3 | undefined;
  export let uBaseColor: THREE.Color = new THREE.Color(0.1, 0.1, 0.1);
  export let noiseVertexShader: string;
  export let noiseFragmentShader: string;

  //shaderMaterial.uniforms.uScale.value.set(scale.x, scale.y, scale.z);
  let uniforms = {
    uTime: { value: 0.0 },
    uScale: { value: uScale },
    uBaseColor: { value: uBaseColor },
  };

  // Sincronizar uniforms con props externos
  $: if (uniforms.uScale) {
    if (uScale) {
      uniforms.uScale.value!.set(uScale.x, uScale.y, uScale.z);
    }
  }

  $: if (uniforms.uBaseColor) uniforms.uBaseColor.value = uBaseColor;

  let totalElapsed = 0;

  // El useTask se ejecutará cada frame
  useTask((delta: number) => {
    totalElapsed += delta;
    if (uniforms.uTime) {
      // Asignamos el tiempo total acumulado, ajustado por una velocidad lenta (0.1)
      uniforms.uTime.value = totalElapsed * 0.1;
    }
  });
</script>

<T.ShaderMaterial
  vertexShader={noiseVertexShader}
  fragmentShader={noiseFragmentShader}
  {uniforms}
/>
