<script lang="ts">
  import { vertexShader, fragmentShader } from "./shaders";
  import { onDestroy } from "svelte";
  import { useThrelte, useTask } from "@threlte/core";
  import * as THREE from "three";
  import type { Mesh, Texture, ShaderMaterial, WebGLRenderTarget } from "three";

  // --- PROPS ---
  export let activeMesh: Mesh; // El cubo rotatorio que define la forma de la refracción
  export let distortion: number = 5.0;
  export let backgroundTexture: Texture | null = null; // Textura de HTML2Canvas o Render Target
  export let captureStrategy: "html" | "3d" = "html"; // Estrategia de captura
  export let renderTarget: WebGLRenderTarget | null = null;
  export let backgroundMesh: Mesh | undefined = undefined;
  export let mouseMagnitude: number;
  const { invalidate, renderer, scene, camera } = useThrelte();

  let glassMesh: Mesh | undefined;
  let shaderMaterial: ShaderMaterial;

  const REFRACTION_SHADER = {
    uniforms: {
      tBackground: { value: null }, // Textura del Render Target (el fondo capturado)
      tDepth: { value: null }, // Aunque se declara, no lo usaremos directamente para simplificar.
      uScale: { value: new THREE.Vector3(1.0, 1.0, 1.0) }, // Nuevo Uniform
      uTime: { value: 0.0 },
      uDistortion: { value: 1.0 }, // Intensidad de la distorsión
      uRefractionRatio: { value: 0.98 }, // Coeficiente de refracción (aire/vidrio)
      uCameraPos: { value: new THREE.Vector3() }, // Posición global de la cámara
      uMouseMagnitude: { value: 0.0 },
    },
    vertexShader,
    fragmentShader,
  };

  // --- FUNCIONES CORE ---

  function initRefraction() {
    if (!activeMesh || !backgroundTexture) return;
    disposeAndClean(); // Limpiar si ya existe

    //activeMesh.visible = false;
    // 1. Crear Material y Geometría
    let glassGeometry: THREE.BufferGeometry;
    if (captureStrategy === "3d") {
      glassGeometry = activeMesh.geometry.clone();
    } else {
      glassGeometry = backgroundMesh!.geometry.clone();
    }
    shaderMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(REFRACTION_SHADER.uniforms),
      vertexShader: REFRACTION_SHADER.vertexShader,
      fragmentShader: REFRACTION_SHADER.fragmentShader,
      transparent: true,
    });

    // 2. Asignar Textura y Uniformes
    if (shaderMaterial.uniforms.tBackground) {
      shaderMaterial.uniforms.tBackground.value = backgroundTexture;
    }
    if (shaderMaterial.uniforms.uDistortion) {
      shaderMaterial.uniforms.uDistortion.value = distortion;
    }
    if (shaderMaterial.uniforms.uScale) {
      const scale = activeMesh.scale; // Obtener la escala del objeto
      shaderMaterial.uniforms.uScale.value.set(scale.x, scale.y, scale.z);
    }
    if (shaderMaterial.uniforms.uMouseMagnitude) {
      shaderMaterial.uniforms.uMouseMagnitude.value = mouseMagnitude; // Pasa el valor
    }
    // 3. Crear Mesh
    glassMesh = new THREE.Mesh(glassGeometry, shaderMaterial);
    // 4. Sincronizar posición inicial
    glassMesh.position.copy(activeMesh.position);
    glassMesh.rotation.copy(activeMesh.rotation);
    // glassMesh.scale.copy(activeMesh.scale);
    /*
    if (backgroundMesh) {
      glassMesh.position.copy(backgroundMesh.position);
      glassMesh.scale.copy(backgroundMesh.scale);
      glassMesh.rotation.copy(backgroundMesh.rotation);
    }
    */
    scene.add(glassMesh);

    start();
  }

  function disposeAndClean() {
    if (glassMesh) {
      glassMesh.geometry.dispose();
      if (Array.isArray(glassMesh.material)) {
        glassMesh.material.forEach((material) => material.dispose());
        scene.remove(glassMesh);
        glassMesh = undefined;
      } else {
        // Manejar un solo material
        glassMesh.material.dispose();
      }
    }
  }

  // --- LÓGICA REACTIVA ---

  // 1. Inicialización/Reconfiguración cuando las props cambian
  $: if (activeMesh && backgroundTexture) {
    if (!glassMesh) {
      initRefraction();
    } else {
      // Actualizar la textura si ya existe el mesh
      if (shaderMaterial.uniforms.tBackground) {
        shaderMaterial.uniforms.tBackground.value = backgroundTexture;
      }
    }
  }

  // 2. Bucle de Renderizado y Render Pass Condicional
  let totalElapsed = 0;

  const { start, stop } = useTask((delta) => {
    // 🔴 Comprobación directa de objetos (Threlte 8.1.5)
    if (!renderer || !glassMesh) return;

    totalElapsed += delta;

    // Sincronizar posición y rotación del vidrio con el cubo rotatorio
    glassMesh.position.copy(activeMesh.position);
    glassMesh.rotation.copy(activeMesh.rotation);
    glassMesh.scale.copy(activeMesh.scale);

    /*
    if (backgroundMesh) {
      activeMesh.scale.copy(backgroundMesh.scale);
      activeMesh.position.copy(backgroundMesh.position);
    }
    */
    //glassMesh.rotation.copy(activeMesh.rotation);
    //glassMesh.position.copy(activeMesh.position);
    if (captureStrategy === "3d" && backgroundTexture && renderTarget) {
      //      glassMesh.visible = false;
      activeMesh.visible = false;
      scene.remove(glassMesh);

      if (shaderMaterial.uniforms.tBackground)
        shaderMaterial.uniforms.tBackground.value = null;
      // 2. Renderizar el fondo en el Render Target
      const originalRenderTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera.current);

      // 3. Restaurar el Render Target original
      renderer.setRenderTarget(originalRenderTarget);
      if (shaderMaterial.uniforms.tBackground)
        shaderMaterial.uniforms.tBackground.value = backgroundTexture;
      scene.add(glassMesh);
    }

    // 4. Lógica de Visibilidad Final
    // El cubo activo DEBE estar invisible al final para el usuario.
    activeMesh.visible = false;
    // El vidrio DEBE ser visible para el render final
    glassMesh.visible = true;

    // 5. Animación del Shader
    if (shaderMaterial) {
      if (shaderMaterial.uniforms.uTime) {
        shaderMaterial.uniforms.uTime.value = totalElapsed;
      }
      if (shaderMaterial.uniforms.uDistortion) {
        shaderMaterial.uniforms.uDistortion.value = distortion;
      }
      if (shaderMaterial.uniforms.uCameraPos) {
        shaderMaterial.uniforms.uCameraPos.value.copy(camera.current.position);
      }

      if (shaderMaterial.uniforms.uMouseMagnitude) {
        shaderMaterial.uniforms.uMouseMagnitude.value = mouseMagnitude; // Pasa el valor
      }
    }

    invalidate(); // Asegura el renderizado del frame
  });

  // --- CICLO DE VIDA ---

  onDestroy(() => {
    stop();
    disposeAndClean();
  });
</script>
