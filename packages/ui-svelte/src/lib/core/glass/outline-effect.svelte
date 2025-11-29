<script lang="ts">
  import { T, useThrelte } from "@threlte/core";
  import * as THREE from "three";
  import { outlineFragmentShader, outlineVertexShader } from "./shaders";

  export let normalRenderTarget: THREE.WebGLRenderTarget | null = null;
  export let uOutlineStrength: number = 1.0; // Intensidad del brillo
  export let uFresnelPower: number = 0.2; // La dureza del brillo (más alto = más concentrado en el borde)
  export let uOutlineColor: THREE.Vector3 = new THREE.Vector3(1.0, 1.0, 1.0); // Blanco

  export let uBorderRadius: number = 0.1;
  export let uBoxNormalizedSize: THREE.Vector2 = new THREE.Vector2(2, 2);
  export let uResolution: THREE.Vector2 = new THREE.Vector2(1, 1);
  let tNormal: THREE.Texture | undefined;

  const { size } = useThrelte();

  $: uniforms = {
    tNormal: { value: tNormal },
    uOutlineStrength: { value: uOutlineStrength },
    uOutlineColor: { value: uOutlineColor },
    uFresnelPower: { value: uFresnelPower },
    uBorderRadius: { value: uBorderRadius },
    uBoxNormalizedSize: { value: uBoxNormalizedSize },
    uResolution: { value: uResolution },
  };

  $: {
    console.log("Uniforms:", {
      uOutlineStrength,
      uFresnelPower,
      uBoxNormalizedSize: uBoxNormalizedSize.toArray(),
      normalRenderTarget: !!normalRenderTarget,
      uResolution: uResolution.toArray(),
      tNormal: !!tNormal,
      uOutlineColor: uOutlineColor.toArray(),
    });
  }

  $: if ($size.width > 0 && $size.height > 0) {
    uResolution.set($size.width, $size.height);
  }
  $: if (normalRenderTarget) {
    tNormal = normalRenderTarget.texture;
  }
</script>

<T.Mesh z={0} position={[0, 0, 0]}>
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
