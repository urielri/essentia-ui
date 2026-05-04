<script lang="ts">
  import { EssentiaRoot } from "essentia-core";
  import { Rect, Glass } from "essentia-styles";
  import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
  import type { Texture } from "three";

  // URL resuelta por Vite desde el alias #hdr → packages/ui/src/hdr_envs/
  import monochromeUrl from "#hdr/monochrome_1k.hdr?url";

  let envTexture: Texture | null = $state(null);
  let loading = $state(false);

  // Intensidad reactiva del env map. Cuando envTexture está cargado, los
  // Glass muestran el reflejo IBL; sin textura, intensity=0 → sin contribución.
  // El shader gatea el efecto con `u_env_intensity` — sin esta binding,
  // cargar el env no tiene efecto visual.
  const envIntensity = $derived(envTexture ? 0.3 : 0);

  // Cursor en coordenadas de mundo (origin = centro, 1 unidad = 1 px CSS)
  let cursorX = $state(0);
  let cursorY = $state(0);

  function onMouseMove(e: MouseEvent) {
    cursorX = e.clientX - window.innerWidth / 2;
    cursorY = -(e.clientY - window.innerHeight / 2);
  }

  function loadEnv() {
    loading = true;
    new RGBELoader().load(
      monochromeUrl,
      (tex) => {
        envTexture = tex;
        loading = false;
      },
      undefined,
      (err) => {
        console.error("[loadEnv] RGBELoader error:", err);
        loading = false;
      },
    );
  }
</script>

<div class="stage" onmousemove={onMouseMove}>
  <EssentiaRoot background="#d1d1d1" envMap={envTexture}>
    <!--
      ── Fondo — capa de rects (z = 0) ────────────────────────────
      Estos rects son el "contenido" que el glass va a refractar.
    -->

    <!-- ── Fondo ─────────────────────────────────────────────────── -->

    <!-- Dos rects grandes con Glass en el medio -->
    <Rect
      width={220}
      height={220}
      radius={24}
      color="#6c63ff"
      x={-180}
      y={160}
    />
    <Rect
      width={220}
      height={220}
      radius={24}
      color="#ff6584"
      x={180}
      y={160}
    />

    <!-- Grid de círculos -->
    <Rect
      width={140}
      height={140}
      radius={70}
      color="#43c6ac"
      x={-300}
      y={-60}
    />
    <Rect
      width={140}
      height={140}
      radius={70}
      color="#f8b500"
      x={-120}
      y={-60}
    />
    <Rect width={140} height={140} radius={70} color="#e8c3f8" x={60} y={-60} />
    <Rect
      width={140}
      height={140}
      radius={70}
      color="#ff6584"
      x={240}
      y={-60}
    />

    <!-- Franja horizontal de rectángulos pequeños -->
    <Rect width={80} height={80} radius={8} color="#f8b500" x={-280} y={-220} />
    <Rect width={80} height={80} radius={8} color="#43c6ac" x={-180} y={-220} />
    <Rect width={80} height={80} radius={8} color="#6c63ff" x={-80} y={-220} />
    <Rect width={80} height={80} radius={8} color="#e8c3f8" x={20} y={-220} />
    <Rect width={80} height={80} radius={8} color="#ff6584" x={120} y={-220} />
    <Rect width={80} height={80} radius={8} color="#6c63ff" x={220} y={-220} />

    <!-- ── Glass ───────────────────────────────────────────────── -->

    <!-- Glass entre los dos rects grandes (cruza los dos colores) -->
    <Glass
      width={260}
      height={70}
      radius={999}
      ior={1.4}
      distortion={0.35}
      chromaticAberration={0.02}
      {envIntensity}
      x={0}
      y={160}
      z={1}
    />

    <!-- Glass sobre la fila de círculos -->
    <Glass
      width={340}
      height={60}
      radius={14}
      ior={1.3}
      distortion={0.25}
      chromaticAberration={0.01}
      {envIntensity}
      x={-30}
      y={-60}
      z={1}
    />

    <!-- Glass pequeño con tinte -->
    <Glass
      width={140}
      height={140}
      radius={24}
      ior={1.5}
      distortion={0.4}
      chromaticAberration={0.025}
      tint="#6c63ff"
      tintOpacity={0.12}
      {envIntensity}
      x={320}
      y={160}
      z={1}
    />

    <!-- Glass sobre la franja de cuadrados — panel largo -->
    <Glass
      width={400}
      height={50}
      radius={10}
      ior={1.35}
      distortion={0.05}
      chromaticAberration={0.015}
      {envIntensity}
      x={cursorX}
      y={cursorY}
      z={1}
    />
    <!-- Glass que sigue al cursor -->
  </EssentiaRoot>
</div>

<div class="controls">
  <button onclick={loadEnv} disabled={loading || !!envTexture}>
    {loading ? "loading…" : envTexture ? "env loaded" : "load env"}
  </button>
  <a href="/product">product demo →</a>
  <a href="/playground">playground →</a>
  <a href="/flex-demo">flex demo →</a>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #0f0f1a;
  }

  .stage {
    width: 100vw;
    height: 100vh;
  }

  .controls {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

  .controls button {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
    padding: 8px 20px;
    border-radius: 999px;
    font-size: 12px;
    letter-spacing: 0.08em;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: background 0.2s;
  }

  .controls button:hover {
    background: rgba(255, 255, 255, 0.14);
  }

  .controls a {
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
    font-size: 12px;
    letter-spacing: 0.08em;
    margin-left: 16px;
  }

  .controls a:hover {
    color: rgba(255, 255, 255, 0.8);
  }
</style>
