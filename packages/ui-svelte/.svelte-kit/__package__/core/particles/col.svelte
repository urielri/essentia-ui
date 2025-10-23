<script lang="ts">
  import type { BrickProps, Sizes } from "#core/types/index.ts"; // Ajusta la ruta a tu archivo de tipos

  /** @type {Sizes} Define el espaciado (usa 'm' por defecto). */
  export let space: Sizes = "m";

  /** @type {string} Clases CSS adicionales. */
  export let className: string = "";

  // $$restProps es una característica de Svelte que recoge todos los props
  // no definidos (como id, style, on:click, etc.) y los aplica al elemento raíz.
  // No necesitas desestructurar 'rest' como en React.
</script>

<div class={`col ${className}`} data-rows={space} {...$$restProps}>
  <slot />
</div>

<style>
  /* Usamos CSS simple y luego dependemos de las clases CSS inyectadas 
     o de los selectores [data-rows] para el layout del grid. 
  */
  .col {
    display: flex;
    flex-direction: column;
    /* Los estilos de espaciado se inyectan a través de las clases en tu CSS global
       o un archivo de estilos específico si usas CSS Modules (s.col).
    */
  }
</style>
