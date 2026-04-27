<script lang="ts">
  import { GlassPlayground } from 'essentia/ui'
</script>

<div class="page">
  <GlassPlayground />
</div>

<nav>
  <a href="/">← demo</a>
</nav>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #111118;
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
</style>
