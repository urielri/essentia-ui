<script lang="ts">
  export let className: string = "";
</script>

<div class={`content-grid ${className}`} {...$$restProps}>
  <slot />
</div>
