<script lang="ts">
  import * as THREE from "three";
  import { T, useThrelte } from "@threlte/core";
  import { outlineVertexShader, outlineFragmentShader } from "./shaders";

  export let normalRenderTarget: THREE.WebGLRenderTarget | null = null;
  export let uOutlineStrength: number = 10.0; // Intensidad del brillo
  export let uOutlineColor: THREE.Vector3 = new THREE.Vector3(1.0, 1.0, 1.0); // Blanco

  export let uFresnelPower: number = 5.0; // La dureza del brillo (más alto = más concentrado en el borde)
  export let uMouseXN: number = 0.5;

  export let uResolution: THREE.Vector2 = new THREE.Vector2(1, 1);

  let tNormal: THREE.Texture | undefined;

  const { size } = useThrelte();

  $: uniforms = {
    tNormal: { value: tNormal },
    uResolution: { value: uResolution },
    uOutlineStrength: { value: uOutlineStrength },
    uOutlineColor: { value: uOutlineColor },
    uMouseXN: { value: uMouseXN },
    uFresnelPower: { value: uFresnelPower },
  };

  $: if (normalRenderTarget) {
    tNormal = normalRenderTarget.texture;
  }

  $: if ($size.width > 0 && $size.height > 0) {
    uniforms.uResolution.value.set($size.width, $size.height);
  }
</script>

<T.Mesh>
  <T.PlaneGeometry args={[2, 2]} />

  <T.ShaderMaterial
    vertexShader={outlineVertexShader}
    fragmentShader={outlineFragmentShader}
    {uniforms}
    transparent={true}
    depthTest={false}
    depthWrite={false}
    blending={THREE.AdditiveBlending}
  />
</T.Mesh>
