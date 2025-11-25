<script lang="ts">
  import * as THREE from "three";
  import { T, useThrelte } from "@threlte/core";
  import { outlineVertexShader, outlineFragmentShader } from "./shaders";

  export let outlineRenderTarget: THREE.WebGLRenderTarget | null = null;

  export let uOutlineWidth: number = 0.0101; // Sensibilidad del detector
  export let uOutlineStrength: number = 21.0; // Intensidad del brillo
  export let uOutlineColor: THREE.Vector3 = new THREE.Vector3(1.0, 1.0, 1.0); // Blanco

  export let uLeftBorderStrength: number = 2.0;
  export let uRightBorderStrength: number = 2.0;
  export let uTopBorderStrength: number = 2.0;
  export let uBottomBorderStrength: number = 2.0;

  export let uLeftBorderFalloff: number = 0.1; // Extensión del degradé (0.0 a 0.5)
  export let uRightBorderFalloff: number = 0.1;
  export let uTopBorderFalloff: number = 0.1;
  export let uBottomBorderFalloff: number = 0.1;
  export let uMouseXN: number = 0.5; // 🟢 NUEVO EXPORT PARA EL SHADER

  export let mouseMagnitude: number = 0.0;

  let tDepth: THREE.Texture | undefined;
  export let uResolution: THREE.Vector2 = new THREE.Vector2(1, 1);

  const { size } = useThrelte();

  $: uniforms = {
    tDepth: { value: tDepth },
    uResolution: { value: uResolution },
    uOutlineWidth: { value: uOutlineWidth },
    uOutlineStrength: { value: uOutlineStrength },
    uOutlineColor: { value: uOutlineColor },
    uLeftBorderStrength: { value: uLeftBorderStrength },
    uRightBorderStrength: { value: uRightBorderStrength },
    uTopBorderStrength: { value: uTopBorderStrength },
    uBottomBorderStrength: { value: uBottomBorderStrength },
    uLeftBorderFalloff: { value: uLeftBorderFalloff },
    uRightBorderFalloff: { value: uRightBorderFalloff },
    uTopBorderFalloff: { value: uTopBorderFalloff },
    uBottomBorderFalloff: { value: uBottomBorderFalloff },
    uMouseMagnitude: { value: mouseMagnitude },
    uMouseXN: { value: uMouseXN },
  };

  $: if (outlineRenderTarget) {
    tDepth = outlineRenderTarget.texture;
    //  uniforms.tDepth.value = tDepth;
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
