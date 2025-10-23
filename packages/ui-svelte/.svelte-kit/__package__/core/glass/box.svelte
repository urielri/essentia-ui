<script lang="ts">
  import { Canvas, T } from "@threlte/core";
  import * as THREE from "three";
  import GlassPlane from "./glass-pane.svelte";
  import AnimatedBox from "./animated-box.svelte";
  import type { WebGLRenderer } from "three";

  export let distortion: number = 1.0;

  let animatedBoxComponent: { update: (elapsed: number) => void } | undefined;
  let activeMesh: THREE.Mesh | undefined;

  const createTransparentRenderer = (
    canvas: HTMLCanvasElement,
  ): WebGLRenderer => {
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
    return renderer;
  };
</script>

<div class="glass-box-container">
  <div class="canvas-layer">
    <Canvas createRenderer={createTransparentRenderer}>
      <T.PerspectiveCamera position={[0, 0, 5]} fov={75} />
      <T.AmbientLight intensity={0.5} />
      <T.DirectionalLight position={[1, 1, 1]} intensity={1.5} />

      <AnimatedBox
        bind:this={animatedBoxComponent}
        bind:meshReference={activeMesh}
      />

      {#if activeMesh && animatedBoxComponent}
        <GlassPlane {activeMesh} {distortion} />
      {/if}
    </Canvas>
  </div>
  <div class="content-layer">
    <slot />
  </div>
</div>

<style>
  .glass-box-container {
    position: relative;
    width: 100%;
    height: 400px;
    border-radius: 1rem;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .content-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.05);
  }
</style>
