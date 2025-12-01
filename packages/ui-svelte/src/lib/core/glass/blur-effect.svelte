<!-- blur-effect.svelte -->
<script lang="ts">
  import { useThrelte, useTask } from "@threlte/core";
  import { onDestroy, onMount } from "svelte";
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
  let initialized = false;

  // IMPORTANTE: Guardar el estado original de autoRender
  let originalAutoRender = true;

  onMount(() => {
    // Guardar el estado original
    originalAutoRender = autoRender.current;
  });

  function initializeComposer() {
    if (
      initialized ||
      !renderer ||
      !scene ||
      !camera.current ||
      !$size.width ||
      !$size.height
    ) {
      return;
    }

    console.log("🎨 Initializing Blur Effect");

    try {
      // IMPORTANTE: Desactivar autoRender ANTES de crear el composer
      autoRender.set(false);

      // Verificar que el renderer tiene contexto
      const gl = renderer.getContext();
      if (!gl) {
        console.error("No WebGL context available");
        autoRender.set(originalAutoRender);
        return;
      }

      // Crear el composer SIN opciones adicionales
      composer = new EffectComposer(renderer);

      // Pass 1: Render Pass
      const renderPass = new RenderPass(scene, camera.current);
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

      // Set size
      composer.setSize($size.width, $size.height);

      initialized = true;
      console.log("✅ Blur Effect initialized");
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
      // Restaurar autoRender si falla
      autoRender.set(originalAutoRender);
      initialized = false;
    }
  }

  onDestroy(() => {
    if (composer) {
      composer.dispose();
      composer = undefined;
    }
    if (kawaseBlurPass) {
      kawaseBlurPass.dispose();
      kawaseBlurPass = undefined;
    }
    // Restaurar autoRender al destruir
    autoRender.set(originalAutoRender);
    initialized = false;
  });

  // Inicializar cuando el tamaño sea válido
  $: if (!initialized && $size.width > 0 && $size.height > 0) {
    initializeComposer();
  }

  // Actualizar tamaño
  $: if (initialized && composer && $size.width > 0 && $size.height > 0) {
    composer.setSize($size.width, $size.height);
    kawaseBlurPass?.setSize($size.width, $size.height);
  }

  // Actualizar parámetros
  $: if (kawaseBlurPass) {
    kawaseBlurPass.scale = blurScale;
    kawaseBlurPass.enabled = enabled;
  }

  // Render loop - REEMPLAZA el render normal de Threlte
  useTask(
    (delta) => {
      if (!initialized) {
        if ($size.width > 0 && $size.height > 0) {
          initializeComposer();
        }
        return;
      }

      if (composer && enabled) {
        try {
          // El composer renderiza la escena
          composer.render(delta);
        } catch (error) {
          console.error("Render error:", error);
        }
      } else if (!enabled && renderer && scene && camera.current) {
        // Si blur está desactivado, renderizar normal
        renderer.render(scene, camera.current);
      }
    },
    {
      stage: renderStage,
      autoInvalidate: false, // Importante: false
    },
  );
</script>
