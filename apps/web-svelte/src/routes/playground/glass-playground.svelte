<script lang="ts">
  import { EssentiaRoot } from 'essentia-core'
  import { Rect, Glass } from 'essentia-styles'

  // ── Estado de los controles ────────────────────────────────────
  let width            = $state(260)
  let height           = $state(140)
  let radius           = $state(20)
  let ior              = $state(1.4)
  let distortion       = $state(0.08)
  let chromaticAberration = $state(0.012)
  let blur             = $state(0)
  let tint             = $state('#ffffff')
  let tintOpacity      = $state(0)
  let fresnelStrength  = $state(0.06)
  let softness         = $state(0)
</script>

<div class="playground">
  <EssentiaRoot background="#111118">

    {#snippet ui()}
      <aside class="panel">
        <h2 class="panel-title">Glass</h2>

        <section>
          <h3>Shape</h3>
          <label>
            <span>width <em>{width}px</em></span>
            <input type="range" min="60" max="600" step="1" bind:value={width} />
          </label>
          <label>
            <span>height <em>{height}px</em></span>
            <input type="range" min="40" max="400" step="1" bind:value={height} />
          </label>
          <label>
            <span>radius <em>{radius}px</em></span>
            <input type="range" min="0" max="999" step="1" bind:value={radius} />
          </label>
        </section>

        <section>
          <h3>Optics</h3>
          <label>
            <span>ior <em>{ior.toFixed(2)}</em></span>
            <input type="range" min="1.0" max="2.5" step="0.01" bind:value={ior} />
          </label>
          <label>
            <span>distortion <em>{distortion.toFixed(3)}</em></span>
            <input type="range" min="0" max="0.5" step="0.001" bind:value={distortion} />
          </label>
          <label>
            <span>chromatic aberration <em>{chromaticAberration.toFixed(3)}</em></span>
            <input type="range" min="0" max="0.05" step="0.001" bind:value={chromaticAberration} />
          </label>
          <label>
            <span>blur <em>{blur}px</em></span>
            <input type="range" min="0" max="40" step="0.5" bind:value={blur} />
          </label>
        </section>

        <section>
          <h3>Surface</h3>
          <label>
            <span>fresnel <em>{fresnelStrength.toFixed(3)}</em></span>
            <input type="range" min="0" max="0.4" step="0.005" bind:value={fresnelStrength} />
          </label>
          <label>
            <span>softness <em>{softness.toFixed(1)}</em></span>
            <input type="range" min="0" max="6" step="0.1" bind:value={softness} />
          </label>
          <label class="color-row">
            <span>tint</span>
            <input type="color" bind:value={tint} />
          </label>
          <label>
            <span>tint opacity <em>{tintOpacity.toFixed(2)}</em></span>
            <input type="range" min="0" max="1" step="0.01" bind:value={tintOpacity} />
          </label>
        </section>
      </aside>
    {/snippet}

    <!-- Fondo colorido para que la refracción sea visible -->
    <Rect width={220} height={220} radius={24}  color="#6c63ff" x={-280} y={140} />
    <Rect width={220} height={220} radius={24}  color="#ff6584" x={0}    y={140} />
    <Rect width={220} height={220} radius={24}  color="#43c6ac" x={280}  y={140} />
    <Rect width={200} height={200} radius={100} color="#f8b500" x={-280} y={-100} />
    <Rect width={200} height={200} radius={100} color="#e8c3f8" x={0}    y={-100} />
    <Rect width={200} height={200} radius={100} color="#ff6584" x={280}  y={-100} />

    <!-- Glass siendo testeado -->
    <Glass
      {width} {height} {radius}
      {ior} {distortion} {chromaticAberration}
      {blur} {tint} {tintOpacity}
      {fresnelStrength} {softness}
      x={0} y={20} z={1}
    />

  </EssentiaRoot>
</div>

<style>
  .playground {
    width: 100%;
    height: 100%;
  }

  /* ── Panel de controles ── */
  .panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 260px;
    background: rgba(10, 10, 18, 0.85);
    backdrop-filter: blur(12px);
    border-left: 1px solid rgba(255, 255, 255, 0.07);
    overflow-y: auto;
    padding: 20px 16px 32px;
    box-sizing: border-box;
    pointer-events: auto;
    font-family: ui-monospace, 'SF Mono', monospace;
  }

  .panel-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
    margin: 0 0 20px;
  }

  section {
    margin-bottom: 24px;
  }

  section h3 {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.2);
    margin: 0 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
  }

  label span {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  label span em {
    font-style: normal;
    color: rgba(255, 255, 255, 0.8);
  }

  input[type='range'] {
    width: 100%;
    accent-color: #6c63ff;
    cursor: pointer;
  }

  .color-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .color-row span {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  input[type='color'] {
    width: 36px;
    height: 24px;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    border-radius: 4px;
  }
</style>
