<script lang="ts">
  import { EssentiaRoot } from 'essentia-core'
  import { Rect, Glass, Text } from 'essentia-styles'

  // ── Estado de los controles ──────────────────────────────────────
  let heroText      = $state('Essentia UI')
  let heroSize      = $state(96)
  let heroColor     = $state('#ffffff')
  let heroSpacing   = $state(2)

  let bodyText      = $state('Liquid glass and MSDF text — composed orthogonally as siblings in world space.')
  let bodySize      = $state(20)
  let bodyMaxWidth  = $state(440)
  let bodyLineHeight = $state(1.4)

  let captionText   = $state('Powered by troika-three-text')
  let captionSize   = $state(14)
  let captionColor  = $state('#8b8ba0')

  let showGlass     = $state(true)
</script>

<div class="page">
  <EssentiaRoot background="#0a0a14">

    {#snippet ui()}
      <aside class="panel">
        <h2 class="panel-title">Text</h2>

        <section>
          <h3>Hero</h3>
          <label>
            <span>text</span>
            <input type="text" bind:value={heroText} />
          </label>
          <label>
            <span>size <em>{heroSize}px</em></span>
            <input type="range" min="24" max="160" step="1" bind:value={heroSize} />
          </label>
          <label class="color-row">
            <span>color</span>
            <input type="color" bind:value={heroColor} />
          </label>
          <label>
            <span>letter spacing <em>{heroSpacing.toFixed(1)}</em></span>
            <input type="range" min="-2" max="10" step="0.1" bind:value={heroSpacing} />
          </label>
        </section>

        <section>
          <h3>Body</h3>
          <label>
            <span>text</span>
            <textarea rows="3" bind:value={bodyText}></textarea>
          </label>
          <label>
            <span>size <em>{bodySize}px</em></span>
            <input type="range" min="10" max="32" step="1" bind:value={bodySize} />
          </label>
          <label>
            <span>max width <em>{bodyMaxWidth}px</em></span>
            <input type="range" min="200" max="800" step="10" bind:value={bodyMaxWidth} />
          </label>
          <label>
            <span>line height <em>{bodyLineHeight.toFixed(2)}</em></span>
            <input type="range" min="1.0" max="2.5" step="0.05" bind:value={bodyLineHeight} />
          </label>
        </section>

        <section>
          <h3>Caption</h3>
          <label>
            <span>text</span>
            <input type="text" bind:value={captionText} />
          </label>
          <label>
            <span>size <em>{captionSize}px</em></span>
            <input type="range" min="10" max="20" step="1" bind:value={captionSize} />
          </label>
          <label class="color-row">
            <span>color</span>
            <input type="color" bind:value={captionColor} />
          </label>
        </section>

        <section>
          <h3>Composition</h3>
          <label class="checkbox-row">
            <input type="checkbox" bind:checked={showGlass} />
            <span>Show glass behind text</span>
          </label>
        </section>
      </aside>
    {/snippet}

    <!-- Fondo decorativo: rects coloridos -->
    <Rect width={300} height={300} radius={150} color="#6c63ff" x={-380} y={120} />
    <Rect width={260} height={260} radius={130} color="#ff6584" x={360}  y={-100} />
    <Rect width={200} height={200} radius={100} color="#43c6ac" x={-200} y={-220} />

    <!-- Glass opcional como capa -->
    {#if showGlass}
      <Glass
        width={620} height={380} radius={32}
        ior={1.35} distortion={0.05} chromaticAberration={0.008}
        blur={6} fresnelStrength={0.08}
        x={0} y={0} z={1}
      />
    {/if}

    <!-- Hero text -->
    <Text
      text={heroText}
      fontSize={heroSize}
      color={heroColor}
      letterSpacing={heroSpacing}
      anchorX={0.5}
      anchorY={0.5}
      x={0}
      y={60}
      z={2}
    />

    <!-- Body text -->
    <Text
      text={bodyText}
      fontSize={bodySize}
      color="#cccccc"
      alignment="center"
      maxWidth={bodyMaxWidth}
      lineHeight={bodyLineHeight}
      anchorX={0.5}
      anchorY={0.5}
      x={0}
      y={-30}
      z={2}
    />

    <!-- Caption text -->
    <Text
      text={captionText}
      fontSize={captionSize}
      color={captionColor}
      anchorX={0.5}
      anchorY={0.5}
      x={0}
      y={-120}
      z={2}
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
    background: #0a0a14;
  }

  .page {
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
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
    font-size: 12px;
    letter-spacing: 0.08em;
  }

  nav a:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  /* ── Panel de controles ── */
  .panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
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

  input[type='text'],
  textarea {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.85);
    padding: 6px 8px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 11px;
    resize: vertical;
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

  .checkbox-row {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .checkbox-row span {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
