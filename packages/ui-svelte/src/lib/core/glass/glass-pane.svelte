<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { useThrelte } from "@threlte/core";
  import type { WebGLRenderer, Camera, Mesh } from "three";

  // Definición de tipo para RenderStage para evitar errores de importación
  type RenderStage = {
    add: (
      fn: (elapsed: number) => void,
      opts?: { order: number },
    ) => () => void;
  };

  // Props que vienen del GlassBox
  export let activeMesh: Mesh;
  export let distortion: number = 1.0;

  // Obtenemos el contexto de Threlte (v8.x)
  const {
    size, // Readable<DOMRect>
    camera, // CurrentWritable<Camera>
    scene, // THREE.Scene
    renderer, // THREE.WebGLRenderer
    renderStage, // RenderStage (objeto funcional)
    invalidate, // () => void
  } = useThrelte();

  // Referencias a los objetos THREE.js. Usamos .current para la cámara.
  const currentRenderer: WebGLRenderer = renderer;
  const currentCamera: Camera = camera.current;

  // Estado interno para el Render Target y el Shader
  let renderTarget: THREE.WebGLRenderTarget;
  let glassMesh: THREE.Mesh;
  let shaderMaterial: THREE.ShaderMaterial | undefined;

  // Función para limpiar el Render Target y recrear el mesh
  const initRefraction = (w: number, h: number) => {
    // Limpieza previa
    if (renderTarget) {
      renderTarget.dispose();
      renderTarget.texture.dispose();
    }
    if (glassMesh) {
      scene.remove(glassMesh);
      glassMesh.geometry.dispose();
      if (shaderMaterial) shaderMaterial.dispose();
    }

    // 1. Crear el Render Target (Target de la Pasada 1)
    renderTarget = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
    });

    // 2. Shader Material (El efecto de refracción)
    const fragmentShader = `
            uniform sampler2D tBackground;
            uniform float uDistortion;
            uniform vec2 uResolution;
            varying vec2 vUv;

            void main() {
                vec2 uv = vUv; 
                float time = uResolution.x * 0.0001;
                float clampedTime = mod(time, 1000.0);
                
                // Patrón de distorsión
                vec2 distortionPattern = sin(clampedTime * 1.5 + uv * 10.0) * uDistortion * 0.05;

                // Muestra la textura del fondo distorsionada. 
                vec4 texColor = texture2D(tBackground, uv + distortionPattern);

                // Mezcla con un color para simular el vidrio (blanco con 15% de mezcla)
                vec3 finalColor = mix(texColor.rgb, vec3(1.0, 1.0, 1.0), 0.15);
                
                gl_FragColor = vec4(finalColor, 0.9);
            }
        `;

    shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tBackground: { value: renderTarget.texture },
        uDistortion: { value: distortion },
        uResolution: { value: new THREE.Vector2(w, h) },
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
      depthWrite: false, // El vidrio no debe escribir en el búfer de profundidad
    });

    // 3. Mesh del Vidrio
    const geometry = new THREE.PlaneGeometry(3, 3);
    glassMesh = new THREE.Mesh(geometry, shaderMaterial);
    // CRÍTICO: Posicionamiento. La caja tiene tamaño 3, el plano debe estar ligeramente
    // delante o en el mismo centro (Z=0) para interceptar la vista.
    glassMesh.position.z = 0.001;

    scene.add(glassMesh);
  };

  // Bloque reactivo para inicialización y redimensionamiento
  $: if ($size.width > 0 && $size.height > 0) {
    initRefraction($size.width, $size.height);
    if (shaderMaterial) {
      if (shaderMaterial.uniforms.uResolution)
        shaderMaterial.uniforms.uResolution.value.set(
          $size.width,
          $size.height,
        );
    }
    invalidate(); // Forzamos un renderizado
  }

  // Bloque reactivo para actualizar la distorsión
  $: if (shaderMaterial) {
    if (shaderMaterial.uniforms.uDistortion)
      shaderMaterial.uniforms.uDistortion.value = distortion;
    invalidate();
  }

  // --- Lógica de la doble pasada inyectada en el bucle de renderizado ---

  let removeRenderHook: (() => void) | undefined;

  const runRefractionPass = (elapsed: number) => {
    if (
      !glassMesh ||
      !activeMesh ||
      !shaderMaterial ||
      !currentRenderer ||
      !currentCamera
    )
      return;

    // 1. Animación del fondo (AnimatedBox.svelte)
    if ((activeMesh as any).update) {
      (activeMesh as any).update(elapsed);
    }

    // --- PASADA 1: Capturar el fondo al RenderTarget ---

    // CRÍTICO: Esconder el plano de vidrio para que NO se capture a sí mismo
    glassMesh.visible = false;

    // El fondo (activeMesh) debe ser visible. Asumimos que lo es por defecto.

    currentRenderer.setRenderTarget(renderTarget);
    currentRenderer.clear();
    currentCamera.updateMatrixWorld();
    currentRenderer.render(scene, currentCamera); // Captura la escena sin el vidrio

    // --- PASADA 2: Renderizar la escena final a la pantalla ---

    currentRenderer.setRenderTarget(null); // Volver al canvas principal
    currentRenderer.clearDepth(); // Limpiamos el búfer de profundidad

    // CRÍTICO: Mostrar el vidrio. Usará la textura capturada arriba.
    glassMesh.visible = true;

    // activeMesh permanece visible (o como estuviera) y el renderizado final de Threlte
    // se encarga de mostrar la escena completa, donde el vidrio tiene el fondo refratado.
  };

  onMount(() => {
    if (renderStage) {
      // Registramos la tarea en el Render Stage. Order: -1 asegura que esta lógica ocurra
      // antes del renderizado final (que tiene order 0).
      removeRenderHook = (renderStage as unknown as RenderStage).add(
        runRefractionPass,
        {
          order: -1,
        },
      );
    }
  });

  // Limpieza al desmontar
  onDestroy(() => {
    if (renderTarget) {
      renderTarget.dispose();
      renderTarget.texture.dispose();
    }
    if (removeRenderHook) {
      removeRenderHook();
    }
    if (glassMesh) {
      scene.remove(glassMesh);
      glassMesh.geometry.dispose();
      if (shaderMaterial) shaderMaterial.dispose();
    }
  });
</script>
