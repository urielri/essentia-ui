<script lang="ts">
  import { useThrelte, useTask } from "@threlte/core";
  import { onDestroy } from "svelte";
  import * as THREE from "three";
  import {
    EffectComposer,
    RenderPass,
    KawaseBlurPass,
    KernelSize,
  } from "postprocessing";

  export let blurScale: number = 2.0;
  export let kernelSize: KernelSize = KernelSize.MEDIUM;
  export let enabled: boolean = true;

  const { scene, camera, renderer, size, autoRender, renderStage } =
    useThrelte();

  let composer: EffectComposer | undefined;
  let kawaseBlurPass: KawaseBlurPass | undefined;
  let renderTarget: THREE.WebGLRenderTarget | undefined;
  let initialized = false;
  let frameCount = 0;

  function initializeComposer() {
    if (
      initialized ||
      !renderer ||
      !scene ||
      !camera.current ||
      !$size.width ||
      !$size.height ||
      $size.width <= 0 ||
      $size.height <= 0
    ) {
      return;
    }

    console.log("🎨 Initializing Blur Effect with size:", $size);

    try {
      // Verificar contexto WebGL
      const gl = renderer.getContext();
      if (!gl) {
        console.error("No WebGL context");
        return;
      }

      // IMPORTANTE: Desactivar autoRender de Threlte
      autoRender.set(false);

      // Crear render target personalizado con las mismas configuraciones que usa Threlte
      renderTarget = new THREE.WebGLRenderTarget($size.width, $size.height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        stencilBuffer: false,
        depthBuffer: true,
        samples: 0, // Sin multisampling para evitar problemas
      });

      // Crear composer con el render target personalizado
      composer = new EffectComposer(renderer, renderTarget);

      // Configurar opciones del composer
      composer.setSize($size.width, $size.height);

      // Pass 1: Render Pass
      const renderPass = new RenderPass(scene, camera.current);
      renderPass.enabled = true;
      composer.addPass(renderPass);

      // Pass 2: Kawase Blur Pass
      kawaseBlurPass = new KawaseBlurPass({
        kernelSize: kernelSize,
        resolutionScale: 0.5,
        width: $size.width,
        height: $size.height,
      });

      kawaseBlurPass.scale = blurScale;
      kawaseBlurPass.enabled = enabled;
      composer.addPass(kawaseBlurPass);

      initialized = true;
      console.log("✅ Blur Effect initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize blur:", error);

      // Limpiar si falla
      if (renderTarget) {
        renderTarget.dispose();
        renderTarget = undefined;
      }
      if (composer) {
        composer.dispose();
        composer = undefined;
      }

      autoRender.set(true);
      initialized = false;
    }
  }

  onDestroy(() => {
    console.log("🧹 Cleaning up blur effect");

    if (kawaseBlurPass) {
      kawaseBlurPass.dispose();
      kawaseBlurPass = undefined;
    }

    if (composer) {
      composer.dispose();
      composer = undefined;
    }

    if (renderTarget) {
      renderTarget.dispose();
      renderTarget = undefined;
    }

    // Restaurar autoRender
    autoRender.set(true);
    initialized = false;
  });

  // Actualizar tamaño cuando cambie
  $: if (
    initialized &&
    composer &&
    renderTarget &&
    $size.width > 0 &&
    $size.height > 0
  ) {
    console.log("Resizing blur to:", $size);

    renderTarget.setSize($size.width, $size.height);
    composer.setSize($size.width, $size.height);

    if (kawaseBlurPass) {
      kawaseBlurPass.setSize($size.width, $size.height);
    }
  }

  // Actualizar parámetros
  $: if (kawaseBlurPass) {
    kawaseBlurPass.scale = blurScale;
    kawaseBlurPass.enabled = enabled;
  }

  // Render loop
  useTask(
    (delta) => {
      // Esperar 5 frames antes de inicializar para asegurar que todo esté listo
      if (!initialized) {
        frameCount++;

        if (frameCount >= 5 && $size.width > 0 && $size.height > 0) {
          initializeComposer();
        }
        return;
      }

      // Si está inicializado y habilitado, renderizar con composer
      if (initialized && composer && enabled) {
        try {
          composer.render(delta);
        } catch (error) {
          console.error("Render error:", error);
          // Si falla, reinicializar
          initialized = false;
          frameCount = 0;
        }
      } else if (!enabled && renderer && scene && camera.current) {
        // Si está deshabilitado, renderizar normal
        renderer.render(scene, camera.current);
      }
    },
    {
      stage: renderStage,
      autoInvalidate: false,
    },
  );
</script>
