<script lang="ts">
  import { EssentiaRoot } from 'essentia-core'
  import { Rect, Text } from 'essentia-styles'
  import { GlassButton, Card } from 'essentia-ui'

  let primaryClicks   = $state(0)
  let secondaryClicks = $state(0)
  let ghostClicks     = $state(0)
  let disabledClicks  = $state(0)

  let demoDisabled = $state(false)
</script>

<div class="page">
  <EssentiaRoot background="#0a0a14">

    {#snippet ui()}
      <aside class="panel">
        <h2 class="panel-title">Higher-level components</h2>

        <section>
          <h3>Click counters</h3>
          <p>primary: <em>{primaryClicks}</em></p>
          <p>secondary: <em>{secondaryClicks}</em></p>
          <p>ghost: <em>{ghostClicks}</em></p>
          <p>disabled: <em>{disabledClicks}</em> (should stay 0)</p>
        </section>

        <section>
          <h3>Demo button</h3>
          <label class="checkbox-row">
            <input type="checkbox" bind:checked={demoDisabled} />
            <span>disabled</span>
          </label>
        </section>
      </aside>
    {/snippet}

    <!-- Fondo decorativo: rects coloridos para que el Glass refracte algo -->
    <Rect width={240} height={240} radius={120} color="#6c63ff" x={-380} y={140} />
    <Rect width={220} height={220} radius={110} color="#ff6584" x={380}  y={-140} />
    <Rect width={180} height={180} radius={90}  color="#43c6ac" x={-340} y={-200} />
    <Rect width={160} height={160} radius={80}  color="#f8b500" x={340}  y={180} />

    <!-- Section: 3 variants stacked vertically -->
    <Text
      text="Variants"
      fontSize={14}
      color="#8b8ba0"
      anchorX={0.5}
      anchorY={0.5}
      x={-260}
      y={150}
    />

    <GlassButton
      label="Primary"
      variant="primary"
      x={-260}
      y={100}
      z={1}
      onclick={() => primaryClicks++}
    />
    <GlassButton
      label="Secondary"
      variant="secondary"
      x={-260}
      y={40}
      z={1}
      onclick={() => secondaryClicks++}
    />
    <GlassButton
      label="Ghost"
      variant="ghost"
      x={-260}
      y={-20}
      z={1}
      onclick={() => ghostClicks++}
    />

    <!-- Section: card showcase -->
    <Text
      text="Card"
      fontSize={14}
      color="#8b8ba0"
      anchorX={0.5}
      anchorY={0.5}
      x={120}
      y={170}
    />

    <Card width={320} height={220} radius={20} blur={6} x={120} y={40} z={1}>
      <Text
        text="Crystal panel"
        fontSize={28}
        color="#ffffff"
        anchorX={0.5}
        anchorY={0.5}
        x={120}
        y={80}
        z={1.01}
      />
      <Text
        text="Compose Glass + Text + GlassButton as siblings in world space."
        fontSize={14}
        color="#cccccc"
        alignment="center"
        maxWidth={280}
        lineHeight={1.4}
        anchorX={0.5}
        anchorY={0.5}
        x={120}
        y={30}
        z={1.01}
      />
      <GlassButton
        label="Action"
        variant="primary"
        width={120}
        height={36}
        radius={18}
        fontSize={14}
        x={120}
        y={-30}
        z={1.02}
        disabled={demoDisabled}
        onclick={() => disabledClicks++}
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

  section p {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin: 6px 0;
  }

  section p em {
    font-style: normal;
    color: rgba(255, 255, 255, 0.9);
  }

  .checkbox-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .checkbox-row span {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
