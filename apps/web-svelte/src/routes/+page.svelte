<script lang="ts">
  import { EssentiaRoot, Rect, Glass } from 'essentia/ui'
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
  import type { Texture } from 'three'

  // URL resuelta por Vite desde el alias #hdr → packages/ui/src/hdr_envs/
  import monochromeUrl from '#hdr/monochrome_1k.hdr?url'

  let envTexture: Texture | null = $state(null)
  let loading = $state(false)

  function loadEnv() {
    loading = true
    new RGBELoader().load(monochromeUrl, (tex) => {
      envTexture = tex
      loading = false
    })
  }
</script>

<div class="stage">
  <EssentiaRoot envMap={envTexture}>

    <!--
      ── Fondo — capa de rects (z = 0) ────────────────────────────
      Estos rects son el "contenido" que el glass va a refractar.
    -->

    <!-- Grid de colores distribuido en el fondo -->
    <Rect width={160} height={160} radius={20} color="#6c63ff" x={-300} y={160}  />
    <Rect width={160} height={160} radius={20} color="#ff6584" x={-120} y={160}  />
    <Rect width={160} height={160} radius={20} color="#43c6ac" x={60}   y={160}  />
    <Rect width={160} height={160} radius={20} color="#f8b500" x={240}  y={160}  />

    <Rect width={160} height={160} radius={80} color="#e8c3f8" x={-300} y={-20}  />
    <Rect width={160} height={160} radius={80} color="#ff6584" x={-120} y={-20}  />
    <Rect width={160} height={160} radius={80} color="#43c6ac" x={60}   y={-20}  />
    <Rect width={160} height={160} radius={80} color="#6c63ff" x={240}  y={-20}  />

    <Rect width={160} height={160} radius={0}  color="#f8b500" x={-300} y={-200} />
    <Rect width={160} height={160} radius={0}  color="#6c63ff" x={-120} y={-200} />
    <Rect width={160} height={160} radius={0}  color="#e8c3f8" x={60}   y={-200} />
    <Rect width={160} height={160} radius={0}  color="#ff6584" x={240}  y={-200} />

    <!--
      ── Fase 3: Glass (z = 1, delante del fondo) ──────────────────
      El glass captura lo que hay detrás y aplica refracción IOR.

      Variaciones de izquierda a derecha:
        - IOR y distortion crecientes
        - Aberración cromática creciente
        - Con tinte sutil
    -->

    <!-- Fila superior: variaciones de IOR — con env map -->
    <Glass width={140} height={60} radius={14}
      ior={1.1} distortion={0.2} chromaticAberration={0}
      envIntensity={0.4} x={-240} y={80} z={1} />

    <Glass width={140} height={60} radius={14}
      ior={1.3} distortion={0.3} chromaticAberration={0.01}
      envIntensity={0.4} x={-80} y={80} z={1} />

    <Glass width={140} height={60} radius={14}
      ior={1.5} distortion={0.4} chromaticAberration={0.02}
      envIntensity={0.4} x={80} y={80} z={1} />

    <Glass width={140} height={60} radius={14}
      ior={1.8} distortion={0.5} chromaticAberration={0.04}
      envIntensity={0.4} x={240} y={80} z={1} />

    <!-- Fila central: glass con tinte -->
    <Glass width={140} height={60} radius={999}
      ior={1.4} distortion={0.3} chromaticAberration={0.015}
      tint="#6c63ff" tintOpacity={0.15}
      envIntensity={0.3} x={-240} y={-20} z={1} />

    <Glass width={140} height={60} radius={999}
      ior={1.4} distortion={0.3} chromaticAberration={0.015}
      tint="#ff6584" tintOpacity={0.15}
      envIntensity={0.3} x={-80} y={-20} z={1} />

    <Glass width={140} height={60} radius={999}
      ior={1.4} distortion={0.3} chromaticAberration={0.015}
      tint="#43c6ac" tintOpacity={0.15}
      envIntensity={0.3} x={80} y={-20} z={1} />

    <Glass width={140} height={60} radius={999}
      ior={1.4} distortion={0.3} chromaticAberration={0.015}
      tint="#f8b500" tintOpacity={0.15}
      envIntensity={0.3} x={240} y={-20} z={1} />

    <!-- Panel grande -->
    <Glass width={360} height={100} radius={20}
      ior={1.4} distortion={0.25} chromaticAberration={0.02}
      envIntensity={0.5} x={-60} y={-160} z={1} />

  </EssentiaRoot>
</div>

<div class="controls">
  <button onclick={loadEnv} disabled={loading || !!envTexture}>
    {loading ? 'loading…' : envTexture ? 'env loaded' : 'load env'}
  </button>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #08080f;
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
</style>
