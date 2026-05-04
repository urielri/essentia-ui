<script lang="ts">
  import { EssentiaRoot } from 'essentia/ui'
  import Scene from './scene.svelte'
</script>

<div class="page">
  <EssentiaRoot background="#0c0c14">
    <Scene />
  </EssentiaRoot>
</div>

<nav>
  <a href="/">← demo</a>
  <span class="title">flex demo</span>
</nav>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #0c0c14;
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
    display: flex;
    gap: 16px;
    align-items: center;
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

  .title {
    color: rgba(255, 255, 255, 0.6);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
</style>
