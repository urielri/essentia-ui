<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core";
  import * as THREE from "three";
  import { onMount } from "svelte";

  // PROPS
  export let noiseVertexShader: string;
  export let noiseFragmentShader: string;
  export let width3D: number = 1;
  export let height3D: number = 1;
  export let mouseX: number;
  export let mouseY: number;
  export let mouseMagnitude: number;

  // CONFIGURACIÓN
  const MAX_PARTICLES = 70000;

  const PARTICLES_PER_SCREEN_PIXEL = 2.08; // 1 partícula cada 50 píxeles²
  const MIN_PARTICLES = 10000;

  export let cssWidth: number = 1; // Agregar estas props
  export let cssHeight: number = 1;

  function calculateParticleCount(): number {
    const screenArea = cssWidth * cssHeight;
    const count = Math.floor(screenArea * PARTICLES_PER_SCREEN_PIXEL);
    return Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, count));
  }
  const { scene } = useThrelte();

  let particles: THREE.Points | undefined;
  let material: THREE.ShaderMaterial | undefined;

  let uniforms = {
    uTime: { value: 0.0 },
    width3D: { value: 1.0 },
    height3D: { value: 1.0 },
    mouse: { value: new THREE.Vector2(0, 0) },
    mouseMagnitude: { value: mouseMagnitude },
    // Color BLANCO para la máscara (R=1, G=1, B=1)
    uBaseColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
  };

  // --- REACTIVIDAD ---
  $: if (material && material.uniforms) {
    // Actualizar uniforms
    material.uniforms.width3D!.value = width3D;
    material.uniforms.height3D!.value = height3D;
    //    material.uniforms.mouse!.value.set(mouseX, -mouseY); // Invertir Y si es necesario
    //   material.uniforms.mouseMagnitude!.value = mouseMagnitude;
    // Actualizar cantidad de partículas (Draw Range)
    if (particles && particles.geometry && width3D > 0 && height3D > 0) {
      // Aseguramos un mínimo de partículas para que no desaparezca en cajas pequeñas
      //const count = Math.max(100, Math.min(MAX_PARTICLES, targetCount));
      const count = calculateParticleCount();
      particles.geometry.setDrawRange(0, count);
    }
  }

  onMount(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const references = new Float32Array(MAX_PARTICLES * 2); // Semilla random estática

    for (let i = 0; i < MAX_PARTICLES; i++) {
      // IMPORTANTE: Normalizado de -0.5 a 0.5
      positions[i * 3 + 0] = Math.random() - 0.5;
      positions[i * 3 + 1] = Math.random() - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // Z muy sutil

      references[i * 2 + 0] = Math.random();
      references[i * 2 + 1] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      "reference",
      new THREE.BufferAttribute(references, 2),
    );
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      Infinity,
    );

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: noiseVertexShader,
      fragmentShader: noiseFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false, // Importante para máscaras superpuestas
    });

    particles = new THREE.Points(geometry, material);
    // Z en 0 o ligeramente atrás según tu setup
    particles.position.set(0, 0, 0);

    scene.add(particles);

    return () => {
      scene.remove(particles!);
      geometry.dispose();
      material!.dispose();
    };
  });
  useTask((delta: number) => {
    if (material) {
      material.uniforms.uTime!.value += delta;
    }
  });
</script>
