<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core";
  import * as THREE from "three";
  import { onMount } from "svelte";

  // PROPS
  export let noiseVertexShader: string;
  export let noiseFragmentShader: string;
  export let width3D: number;
  export let height3D: number;
  export let mouseX: number;
  export let mouseY: number;
  export let mouseMagnitude: number;

  const NUM_PARTICLES = 50000;
  const { scene } = useThrelte();

  let particles: THREE.Points | undefined;
  let material: THREE.ShaderMaterial | undefined;

  // --- Uniforms ---
  let uniforms = {
    u_time: { value: 0.0 },
    //    uBaseColor: { value: new THREE.Color(0.1, 0.1, 0.1) },
    perlinFactor: { value: 0.2 }, // Densidad inicial del ruido
    randomFactor: { value: 1.0 }, // Desplazamiento random inicial
    width3D: { value: width3D },
    height3D: { value: height3D },
    mouse: { value: new THREE.Vector2(0, 0) },
    mouseMagnitude: { value: mouseMagnitude },
  };

  // --- Sincronización de Props ---
  $: if (material && material.uniforms) {
    material.uniforms.width3D!.value = width3D;
    material.uniforms.height3D!.value = height3D;
    material.uniforms.mouse!.value.set(mouseX, -mouseY);
    material.uniforms.mouseMagnitude!.value = mouseMagnitude;
  }

  // --- Inicialización 3D ---
  onMount(() => {
    // 1. Geometría: Crea la nube de puntos
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(NUM_PARTICLES * 3);
    const references = new Float32Array(NUM_PARTICLES * 2);
    geometry.setAttribute(
      "reference",
      new THREE.BufferAttribute(references, 2),
    );

    // PREVENCIÓN: Desactiva el cálculo de la esfera delimitadora si no la necesitas
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      Infinity,
    );
    geometry.boundingSphere.radius = Infinity; // Esto es solo un hack para detener el cálculo
    for (let i = 0; i < NUM_PARTICLES; i++) {
      // Posiciones aleatorias centradas en la escena
      const x = Math.random() * width3D - width3D / 2;
      const y = Math.random() * height3D - height3D / 2;
      const z = Math.random() * 5 - 2.5; // Pequeña profundidad

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Attribute 'reference'
      references[i * 2 + 0] = Math.random();
      references[i * 2 + 1] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      "reference",
      new THREE.BufferAttribute(references, 2),
    );

    // 2. Material: Carga los Shaders
    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: noiseVertexShader,
      fragmentShader: noiseFragmentShader,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending, // blending aditivo se ve genial en nubes de partículas
    });

    // 3. Puntos: Crea el objeto THREE.Points
    particles = new THREE.Points(geometry, material);
    particles.position.z = -2; // Coloca la nube ligeramente detrás de otros objetos

    scene.add(particles);

    return () => {
      scene.remove(particles!);
      geometry.dispose();
      material!.dispose();
    };
  });

  // --- Bucle de Actualización ---
  useTask((delta: number) => {
    if (material) {
      material.uniforms.u_time!.value += delta;
    }
  });
</script>
