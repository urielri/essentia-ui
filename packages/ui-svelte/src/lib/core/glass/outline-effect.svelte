<script lang="ts">
  import { T } from "@threlte/core";
  import * as THREE from "three";
  import { outlineFragmentShader, outlineVertexShader } from "./shaders";

  export let normalRenderTarget: THREE.WebGLRenderTarget | null = null;
  export let uOutlineStrength: number = 0.1; // Intensidad del brillo
  export let uFresnelPower: number = 1.4; // La dureza del brillo (más alto = más concentrado en el borde)
  export let uOutlineColor: THREE.Vector3 = new THREE.Vector3(1.0, 1.0, 1.0); // Blanco

  export let uBorderRadius: number = 0.1;
  export let uBoxNormalizedSize: THREE.Vector2 = new THREE.Vector2(2, 2);
  let tNormal: THREE.Texture | undefined;

  $: uniforms = {
    tNormal: { value: tNormal },
    uOutlineStrength: { value: uOutlineStrength },
    uOutlineColor: { value: uOutlineColor },
    uFresnelPower: { value: uFresnelPower },
    uBorderRadius: { value: uBorderRadius },
    uBoxNormalizedSize: { value: uBoxNormalizedSize },
  };

  $: if (normalRenderTarget) {
    tNormal = normalRenderTarget.texture;
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
