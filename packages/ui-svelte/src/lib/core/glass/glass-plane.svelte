<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core";
  import { onDestroy } from "svelte";
  import type { Mesh, ShaderMaterial, Texture } from "three";
  import * as THREE from "three";
  import { fragmentShader, vertexShader } from "./shaders";

  // --- PROPS ---
  export let activeMesh: Mesh; // El cubo rotatorio que define la forma de la refracción
  export let distortion: number = 5.0;
  export let backgroundTexture: Texture | null = null; // Textura de HTML2Canvas o Render Target
  export let mouseMagnitude: number;
  const { invalidate, scene, camera } = useThrelte();

  export let glassMesh: Mesh | undefined;
  let shaderMaterial: ShaderMaterial;

  const REFRACTION_SHADER = {
    uniforms: {
      tBackground: { value: null }, // Textura del Render Target (el fondo capturado)
      tDepth: { value: null }, // Aunque se declara, no lo usaremos directamente para simplificar.
      uScale: { value: new THREE.Vector3(1, 1, 1) }, // Nuevo Uniform
      uTime: { value: 0.0 },
      uDistortion: { value: 1.0 }, // Intensidad de la distorsión
      uRefractionRatio: { value: 0.98 }, // Coeficiente de refracción (aire/vidrio)
      uCameraPos: { value: new THREE.Vector3() }, // Posición global de la cámara
      uMouseMagnitude: { value: 0.0 },
      uBaseColor: { value: new THREE.Color(0.8, 0.8, 0.8) }, // Gris claro
    },
    vertexShader,
    fragmentShader,
  };

  // --- FUNCIONES CORE ---

  function initRefraction() {
    if (!activeMesh || !backgroundTexture) return;
    disposeAndClean(); // Limpiar si ya existe

    let glassGeometry: THREE.BufferGeometry;

    glassGeometry = activeMesh.geometry.clone();
    shaderMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(REFRACTION_SHADER.uniforms),
      vertexShader: REFRACTION_SHADER.vertexShader,
      fragmentShader: REFRACTION_SHADER.fragmentShader,
      transparent: true,
    });

    // 2. Asignar Textura y Uniformes
    if (shaderMaterial.uniforms) {
      if (shaderMaterial.uniforms.tBackground)
        shaderMaterial.uniforms.tBackground.value = backgroundTexture;

      if (shaderMaterial.uniforms.uDistortion)
        shaderMaterial.uniforms.uDistortion.value = distortion;

      if (shaderMaterial.uniforms.uScale) {
        const scale = activeMesh.scale; // Obtener la escala del objeto
        shaderMaterial.uniforms.uScale.value.set(scale.x, scale.y, scale.z);
      }
      if (shaderMaterial.uniforms.uMouseMagnitude)
        shaderMaterial.uniforms.uMouseMagnitude.value = mouseMagnitude;
    }

    // 3. Crear Mesh
    glassMesh = new THREE.Mesh(glassGeometry, shaderMaterial);

    // 4. Sincronizar posición inicial
    glassMesh.position.copy(activeMesh.position);
    glassMesh.rotation.copy(activeMesh.rotation);
    glassMesh.scale.copy(activeMesh.scale);

    scene.add(glassMesh);
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

  const { stop } = useTask((delta) => {
    if (!glassMesh || !activeMesh) return;

    // Sincronizar posición y rotación del vidrio con el cubo rotatorio
    glassMesh.position.copy(activeMesh.position);
    glassMesh.rotation.copy(activeMesh.rotation);
    glassMesh.scale.copy(activeMesh.scale);
    glassMesh.position.z += 0.001;

    // Animación del Shader
    totalElapsed += delta;
    if (shaderMaterial) {
      if (shaderMaterial.uniforms.uTime)
        shaderMaterial.uniforms.uTime.value = totalElapsed;
      if (shaderMaterial.uniforms.uDistortion)
        shaderMaterial.uniforms.uDistortion.value = distortion;
      if (shaderMaterial.uniforms.uCameraPos)
        shaderMaterial.uniforms.uCameraPos.value.copy(camera.current.position);
      if (shaderMaterial.uniforms.uMouseMagnitude)
        shaderMaterial.uniforms.uMouseMagnitude.value = mouseMagnitude;
    }

    invalidate(); // Asegura el renderizado del frame
  });

  onDestroy(() => {
    stop();
    disposeAndClean();
  });
</script>
