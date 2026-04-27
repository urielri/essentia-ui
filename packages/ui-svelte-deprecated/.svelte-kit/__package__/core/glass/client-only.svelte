<script>
  import { onMount } from "svelte";

  let mounted = false;

  onMount(() => {
    mounted = true;

    console.log("ClientOnly mounted!");
  });
</script>

{#if browser && mounted}
  <slot />
{/if}
