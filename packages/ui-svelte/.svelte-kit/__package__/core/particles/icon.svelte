<script lang="ts">
  import type { Sizes } from "#core/types/index.ts";

  export let size: Sizes = "m";
  export let className: string = "";
</script>

<div class={`icon ${className}`} data-testid="icon" {...$$restProps}>
  <slot />
</div>

<style>
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
  }
</style>
