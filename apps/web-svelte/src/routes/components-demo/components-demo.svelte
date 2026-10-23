<script lang="ts">
  import { EssentiaRoot } from 'essentia-core'
  import { Rect, Text } from 'essentia-styles'
  import { GlassButton, Card, type GlassButtonVariant } from 'essentia-ui'

  const variants: GlassButtonVariant[] = ['primary', 'secondary', 'ghost']

  // ── Estado de los controles ──────────────────────────────────────
  let label         = $state('Continue')
  let buttonWidth   = $state(180)
  let buttonHeight  = $state(48)
  let buttonRadius  = $state(24)
  let buttonFont    = $state(16)
  let disabled      = $state(false)

  let cardBlur      = $state(4)
  let cardTint      = $state('#ffffff')
  let cardOpacity   = $state(0.06)

  // Contador de clicks por variante + botón anidado en el Card
  let clicks = $state<Record<GlassButtonVariant, number>>({
    primary: 0,
    secondary: 0,
    ghost: 0,
  })
  let cardClicks = $state(0)

  function resetCounters() {
    clicks = { primary: 0, secondary: 0, ghost: 0 }
    cardClicks = 0
  }

  // Centro del área visible: el panel de controles ocupa 280px a la derecha
  const offsetX = -140

  // Columna de botones: centrada verticalmente con separación fija
  const columnX = offsetX - 220
  const rowGap = 90
  const rowY = (i: number) => rowGap - i * rowGap

  // Card a la derecha
  const cardX = offsetX + 230
  const cardW = 380
  const cardH = 300
</script>

<div class="page">
  <EssentiaRoot background="#0a0a14">

    {#snippet ui()}
      <aside class="panel">
        <h2 class="panel-title">Components</h2>

        <section>
          <h3>GlassButton</h3>
          <label>
            <span>label</span>
            <input type="text" bind:value={label} />
          </label>
          <label>
            <span>width <em>{buttonWidth}px</em></span>
            <input type="range" min="80" max="320" step="1" bind:value={buttonWidth} />
          </label>
          <label>
            <span>height <em>{buttonHeight}px</em></span>
            <input type="range" min="28" max="80" step="1" bind:value={buttonHeight} />
          </label>
          <label>
            <span>radius <em>{buttonRadius}px</em></span>
            <input type="range" min="0" max="40" step="1" bind:value={buttonRadius} />
          </label>
          <label>
            <span>font size <em>{buttonFont}px</em></span>
            <input type="range" min="10" max="28" step="1" bind:value={buttonFont} />
          </label>
          <label class="checkbox-row">
            <input type="checkbox" bind:checked={disabled} />
            <span>Disabled</span>
          </label>
        </section>

        <section>
          <h3>Card</h3>
          <label>
            <span>blur <em>{cardBlur}</em></span>
            <input type="range" min="0" max="12" step="1" bind:value={cardBlur} />
          </label>
          <label class="color-row">
            <span>tint</span>
            <input type="color" bind:value={cardTint} />
          </label>
          <label>
            <span>tint opacity <em>{cardOpacity.toFixed(2)}</em></span>
            <input type="range" min="0" max="0.4" step="0.01" bind:value={cardOpacity} />
          </label>
        </section>

        <section>
          <h3>Clicks</h3>
          {#each variants as variant}
            <div class="stat"><span>{variant}</span><em>{clicks[variant]}</em></div>
          {/each}
          <div class="stat"><span>card</span><em>{cardClicks}</em></div>
          <button class="reset" onclick={resetCounters}>reset</button>
        </section>
      </aside>
    {/snippet}

    <!-- Fondo decorativo: rects coloridos que el glass refracta -->
    <Rect width={320} height={320} radius={160} color="#6c63ff" x={offsetX - 300} y={140} />
    <Rect width={260} height={260} radius={130} color="#ff6584" x={offsetX + 260} y={-120} />
    <Rect width={200} height={200} radius={100} color="#43c6ac" x={offsetX - 180} y={-200} />
    <Rect width={160} height={160} radius={32}  color="#f9a826" x={offsetX + 320} y={160} />

    <!-- Columna de variantes apiladas -->
    {#each variants as variant, i}
      <GlassButton
        {label}
        {variant}
        {disabled}
        width={buttonWidth}
        height={buttonHeight}
        radius={buttonRadius}
        fontSize={buttonFont}
        x={columnX}
        y={rowY(i)}
        z={1}
        onclick={() => clicks[variant]++}
      />
      <Text
        text={`${variant} · ${clicks[variant]}`}
        fontSize={14}
        color="#8b8ba0"
        anchorX={0}
        anchorY={0.5}
        x={columnX + buttonWidth / 2 + 20}
        y={rowY(i)}
        z={2}
      />
    {/each}

    <!-- Card con texto + botón anidado (hermanos en world space) -->
    <Card
      width={cardW}
      height={cardH}
      radius={28}
      blur={cardBlur}
      tint={cardTint}
      tintOpacity={cardOpacity}
      x={cardX}
      y={0}
      z={1}
    >
      <Text
        text="Liquid Card"
        fontSize={32}
        color="#ffffff"
        anchorX={0.5}
        anchorY={0.5}
        x={cardX}
        y={80}
        z={2}
      />
      <Text
        text="Glass background with primitives composed as siblings. No internal layout."
        fontSize={15}
        color="#cccccc"
        alignment="center"
        maxWidth={cardW - 64}
        lineHeight={1.4}
        anchorX={0.5}
        anchorY={0.5}
        x={cardX}
        y={10}
        z={2}
      />
      <GlassButton
        label={`Clicked ${cardClicks}×`}
        variant="primary"
        {disabled}
        width={200}
        height={44}
        x={cardX}
        y={-80}
        z={2}
        onclick={() => cardClicks++}
      />
    </Card>

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

  input[type='text'] {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.85);
    padding: 6px 8px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 11px;
  }

  .color-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
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

  .stat {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 8px;
  }

  .stat em {
    font-style: normal;
    color: rgba(255, 255, 255, 0.85);
  }

  .reset {
    margin-top: 4px;
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
    padding: 6px 8px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
  }

  .reset:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
