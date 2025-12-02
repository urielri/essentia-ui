<script lang="ts">
  import type { BrickProps, Sizes } from "#core/types/index.ts"; // Ajusta la ruta a tu archivo de tipos

  /** @type {Sizes} Define el espaciado (usa 'm' por defecto). */
  export let space: Sizes = "m";

  /** @type {string} Clases CSS adicionales. */
  export let className: string = "";

  // $$restProps captura atributos HTML adicionales.
</script>

<div class={`row ${className}`} data-rows={space} {...$$restProps}>
  <slot />
</div>

<style>
  .row {
    display: flex;
    flex-direction: row;
    /* Alineación por defecto para una fila */
    align-items: center;
  }
</style>
