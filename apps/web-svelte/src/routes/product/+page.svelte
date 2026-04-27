<script lang="ts">
  import { EssentiaRoot, Image, Glass } from "essentia/ui";

  let vw = $state(typeof window !== "undefined" ? window.innerWidth : 1280);
  let vh = $state(typeof window !== "undefined" ? window.innerHeight : 800);

  let cursorX = $state(0);
  let cursorY = $state(0);

  function onMouseMove(e: MouseEvent) {
    cursorX = e.clientX - vw / 2;
    cursorY = -(e.clientY - vh / 2);
  }

  function onResize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
  }
</script>

<svelte:window onresize={onResize} />

<div class="stage" onmousemove={onMouseMove}>
  <EssentiaRoot background="#0a0a0a">
    <!-- Imagen de fondo — ocupa todo el viewport -->
    <Image
      src="/hero.jpg"
      width={vw}
      height={vh}
      radius={0}
      x={0}
      y={0}
      z={0}
    />

    <!-- Glass panel superior: título/info del producto -->
    <Glass
      width={500}
      height={70}
      radius={999}
      ior={1.3}
      distortion={0.06}
      chromaticAberration={0.008}
      x={0}
      y={220}
      z={1}
    />

    <!-- Glass panel inferior: CTA / precio -->
    <Glass
      width={320}
      height={56}
      radius={999}
      ior={1.3}
      distortion={0.06}
      chromaticAberration={0.008}
      tint="#ffffff"
      tintOpacity={0.06}
      x={0}
      y={-230}
      z={1}
    />

    <!-- Glass lateral izquierdo: detalles -->
    <Glass
      width={180}
      height={240}
      radius={20}
      ior={1.25}
      distortion={0.05}
      chromaticAberration={0.006}
      x={cursorX}
      y={cursorY}
      blur={6}
      z={2}
    />

    <!-- Glass que sigue el cursor -->
    <Glass
      width={100}
      height={100}
      radius={999}
      ior={1.4}
      distortion={0.08}
      chromaticAberration={0.012}
      x={cursorX}
      y={cursorY}
      z={1}
    />
  </EssentiaRoot>
</div>

<nav>
  <a href="/">← demo</a>
</nav>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #0a0a0a;
  }

  .stage {
    width: 100vw;
    height: 100vh;
  }

  nav {
    position: fixed;
    top: 20px;
    left: 24px;
    z-index: 10;
  }

  nav a {
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    font-size: 12px;
    letter-spacing: 0.08em;
  }

  nav a:hover {
    color: rgba(255, 255, 255, 0.9);
  }
</style>
