<script>
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  let mounted = false;

  onMount(() => {
    mounted = true;
  });
</script>

{#if browser && mounted}
  <slot />
{/if}
