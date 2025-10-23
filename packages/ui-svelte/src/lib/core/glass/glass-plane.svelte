<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { useThrelte, useTask } from "@threlte/core";
  import type {
    WebGLRenderer,
    Camera,
    Mesh,
    ShaderMaterial,
    Texture,
    MeshBasicMaterial,
  } from "three";

  // Definición de tipo para RenderStage (necesario para el hook)
  type RenderStage = {
    add: (
      fn: (elapsed: number) => void,
      opts?: { order: number },
    ) => () => void;
  };

  // Props que vienen del GlassBox
  export let activeMesh: Mesh;
  export let distortion: number = 1.0;
  export let backgroundMesh: Mesh; // CRÍTICO: Debe ser el Mesh de fondo
  export let animatedBoxComponent:
    | { update: (elapsed: number) => void }
    | undefined;
  // --- Variables Locales ---
  let backgroundTexture: Texture | null = null; // La textura extraída del backgroundMesh
  let glassMesh: Mesh | undefined;
  let shaderMaterial: ShaderMaterial | undefined;
  let totalElapsed = 0;

  const { size, camera, renderer, renderStage, invalidate, scene } =
    useThrelte();

  const currentRenderer: WebGLRenderer = renderer;
  const currentCamera: Camera = camera.current;

  // Función auxiliar para forzar la limpieza y recreación
  const disposeAndClean = () => {
    if (glassMesh) {
      // Nota: No eliminamos el Mesh de la escena aquí, lo hacemos al desmontar
      glassMesh.geometry.dispose();
    }
    if (shaderMaterial) shaderMaterial.dispose();
  };

  useTask((delta) => {
    totalElapsed += delta; // Acumular el tiempo total si no viene del bucle de Threlte

    if (activeMesh) {
      // Cambiar a false para dejar de ver el cubo
      activeMesh.visible = true;
    }
    // Lógica de runRefractionPass
    if (shaderMaterial) {
      // Usar totalElapsed para la animación del shader
      if (shaderMaterial.uniforms.uTime)
        shaderMaterial.uniforms.uTime.value = totalElapsed * 0.001;
    }

    // 🔴 CRÍTICO: Forzar la invalidación.
    // Por defecto, useTask lo hace, pero si tenemos un problema de renderizado, lo aseguramos.
    invalidate();
  });
  const initRefraction = (w: number, h: number) => {
    disposeAndClean();

    // 🔴 1. Fragment Shader (Sin cambios, usa la lógica de distorsión simple)
    const fragmentShader = `
      uniform sampler2D tBackgroundHTML; 
      uniform float uDistortion;
      uniform vec2 uResolution;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        
        vec2 offset = vec2(
          sin(uv.y * 10.0 + uTime * 1.5) * uDistortion * 0.01,
          cos(uv.x * 10.0 - uTime * 0.5) * uDistortion * 0.01
        );
        
        vec2 distortedUv = uv + offset;
        
        vec4 texColor = texture2D(tBackgroundHTML, distortedUv);

        vec3 finalColor = mix(texColor.rgb, vec3(1.0, 1.0, 1.0), 0.15);
        
        gl_FragColor = vec4(finalColor, 0.9); 
      }
    `;

    shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tBackgroundHTML: { value: backgroundTexture }, // Inicialmente null
        uDistortion: { value: distortion },
        uResolution: { value: new THREE.Vector2(w, h) },
        uTime: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    // 🔴 3. Mesh del Vidrio (CRÍTICO: Usar un tamaño temporal)
    // El tamaño y la posición final se ajustarán en el bloque reactivo de 'backgroundMesh'.
    const geometry = new THREE.PlaneGeometry(1, 1);
    glassMesh = new THREE.Mesh(geometry, shaderMaterial);

    // Posición temporal. Se corrige reactivamente.
    glassMesh.position.z = -5;

    // Solo añadimos a la escena si no se ha añadido ya (para evitar duplicados en el redimensionamiento)
    if (!scene.children.includes(glassMesh)) {
      scene.add(glassMesh);
    }
  };

  // 🔴 Asegúrate de que este bloque esté presente en tu <script>
  // Maneja la copia de la geometría del fondo al plano de vidrio.
  $: if (backgroundMesh && $size.width > 0) {
    //console.log("entra al bloque reactivo");
    const material = backgroundMesh.material as MeshBasicMaterial;
    backgroundTexture = material.map;

    if (glassMesh) {
      // Copiar geometría y posición del fondo para que coincida con la textura
      glassMesh.geometry = backgroundMesh.geometry.clone();
      glassMesh.position.copy(backgroundMesh.position);

      // Mover el vidrio ligeramente hacia adelante para que no colisione con el fondo.
      // Asumiendo que BACKGROUND_Z es, por ejemplo, -10.
      glassMesh.position.z = backgroundMesh.position.z + 0.1;

      // Actualizar la textura y el material del shader
      if (
        shaderMaterial &&
        backgroundTexture &&
        shaderMaterial.uniforms.tBackgroundHTML
      ) {
        shaderMaterial.uniforms.tBackgroundHTML.value = backgroundTexture;
      }
    }

    // Forzar renderizado
    invalidate();
  } // Bloque reactivo para inicialización y redimensionamiento
  $: if ($size.width > 0 && $size.height > 0) {
    initRefraction($size.width, $size.height);
    if (shaderMaterial) {
      if (shaderMaterial.uniforms.uResolution)
        shaderMaterial.uniforms.uResolution.value.set(
          $size.width,
          $size.height,
        );
    }
    invalidate();
  }

  // Bloque reactivo para actualizar la distorsión
  $: if (shaderMaterial) {
    if (shaderMaterial.uniforms.uDistortion)
      shaderMaterial.uniforms.uDistortion.value = distortion;
    invalidate();
  }

  // 🔴 Bloque Reactivo para extraer la textura del Mesh de fondo
  $: if (backgroundMesh) {
    const material = backgroundMesh.material as MeshBasicMaterial;
    backgroundTexture = material.map;

    // 🔴 CRÍTICO: Si la textura y el material existen, pasamos la textura al shader.
    if (shaderMaterial && backgroundTexture) {
      if (shaderMaterial.uniforms.tBackgroundHTML)
        shaderMaterial.uniforms.tBackgroundHTML.value = backgroundTexture;
      invalidate();
    }
  }

  // --- Lógica de Renderizado (Actualización de Uniforms) ---
  let removeRenderHook: (() => void) | undefined;

  const runRefractionPass = (elapsed: number) => {
    console.log("runRefractionPass", elapsed);
    if (!shaderMaterial) return;

    console.log("animatedBoxComponent", animatedBoxComponent);
    if (animatedBoxComponent && animatedBoxComponent.update) {
      animatedBoxComponent.update(elapsed);
    }
    if (shaderMaterial.uniforms.uTime)
      // 🔴 Actualizar el tiempo para la animación en el shader
      shaderMaterial.uniforms.uTime.value = elapsed * 0.001;

    // 🔴 El backgroundMesh, el activeMesh y el glassMesh se renderizan en el ciclo principal.
    // Solo necesitamos forzar el render (si no está animando la caja).
    // Si la caja ya tiene un loop de animación, no es necesario invalidar aquí.
    invalidate();
  };

  onDestroy(() => {
    disposeAndClean();
    // 🔴 NO limpiar removeRenderHook o removeAnimationHook
    if (glassMesh) {
      scene.remove(glassMesh);
    }
  }); // Limpieza al desmontar
  /*
  onDestroy(() => {
    disposeAndClean();
    if (removeRenderHook) {
      removeRenderHook();
    }
    // Eliminamos el Mesh de la escena al desmontar
    if (glassMesh) {
      scene.remove(glassMesh);
    }
  });
  */
</script>
