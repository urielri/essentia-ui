<script lang="ts">
  export let className: string = "";
</script>

<div class={`root grid ${className}`} {...$$restProps}>
  <slot />
</div>
