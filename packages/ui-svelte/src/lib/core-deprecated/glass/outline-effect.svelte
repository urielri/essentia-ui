<script lang="ts">
  import { T, useThrelte } from "@threlte/core";
  import * as THREE from "three";
  import { outlineFragmentShader, outlineVertexShader } from "./shaders";

  export let normalRenderTarget: THREE.WebGLRenderTarget | null = null;
  export let uOutlineStrength: number = 3.0; // Intensidad del brillo
  export let uFresnelPower: number = 0.5; // La dureza del brillo (más alto = más concentrado en el borde)
  export let uOutlineColor: THREE.Vector3 = new THREE.Vector3(1.0, 1.0, 1.0); // Blanco

  export let mouseX: number = 0;
  export let mouseY: number = 0;
  export let mouseMagnitude: number = 0;

  export let dpr: number = 1;
  export let cssWidth: number = 1;
  export let cssHeight: number = 1;

  export let uBorderRadius: number = 0.1;
  export let uBoxNormalizedSize: THREE.Vector2 = new THREE.Vector2(2, 2);
  export let uResolution: THREE.Vector2 = new THREE.Vector2(1, 1);

  let tNormal: THREE.Texture | undefined;
  const { invalidate } = useThrelte();

  const uMouseVector = new THREE.Vector2(0, 0);
  const uniforms = {
    tNormal: { value: null as THREE.Texture | null },
    uOutlineStrength: { value: uOutlineStrength },
    uOutlineColor: { value: uOutlineColor },
    uFresnelPower: { value: uFresnelPower },
    uBorderRadius: { value: uBorderRadius },
    uBoxNormalizedSize: { value: uBoxNormalizedSize },
    uResolution: { value: uResolution },
    uDpr: { value: dpr },
    uMouse: { value: uMouseVector },
    uMouseMagnitude: { value: mouseMagnitude },
  };

  // Actualizar uniforms y forzar re-render
  $: {
    uniforms.tNormal.value = tNormal ?? null;
    uniforms.uOutlineStrength.value = uOutlineStrength;
    uniforms.uFresnelPower.value = uFresnelPower;
    uniforms.uBorderRadius.value = uBorderRadius;
    uniforms.uDpr.value = dpr;

    // Mouse
    uniforms.uMouse.value.set(mouseX, -mouseY);
    uniforms.uMouseMagnitude.value = mouseMagnitude;

    // Resolution
    uResolution.set(cssWidth * dpr, cssHeight * dpr);

    // FORZAR RE-RENDER
    invalidate();
  }

  // Actualizar tNormal cuando cambia normalRenderTarget
  $: if (normalRenderTarget) {
    tNormal = normalRenderTarget.texture;
  }
</script>

<T.Mesh z={0}>
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
