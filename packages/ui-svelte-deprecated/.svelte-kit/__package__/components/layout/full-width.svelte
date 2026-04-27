<script lang="ts">
  export let className: string = "";
</script>

<div class={`full-width ${className}`} {...$$restProps}>
  <slot />
</div>
