<script lang="ts">
  // Asume que 'Sizes' está definido en un archivo de tipos
  // Ajusta la ruta de importación según tu estructura de carpetas
  import type { Sizes } from "#core/types/index.ts";

  /**
   * @type {Sizes} Define el tamaño del texto (ej. 'sm', 'm', 'lg').
   * Usa 'm' por defecto.
   */
  export let size: Sizes = "m";

  /**
   * @type {string} Clases CSS adicionales.
   */
  export let className: string = "";

  // Nota: La variable s.text sugiere que estás usando CSS Modules.
  // En Svelte, generalmente usamos clases globales o estilos encapsulados.
  // Asumiremos que 'text' es una clase base y 'text-{size}' es el modificador.
</script>

<span
  class={`text text-${size} ${className}`}
  data-testid="text"
  {...$$restProps}
>
  <slot />
</span>

<style>
  /* Ejemplo de estilos encapsulados, si usas CSS Modules,
    asegúrate de que 'text' se importe o que tu preprocesador lo maneje.
    
    En este ejemplo, 'text' es la clase base: 
  */
  .text {
    font-family: sans-serif;
    /* Define estilos base */
  }

  /* El tamaño real debe ser definido por tu CSS global o CSS Modules */
  /*
  .text-sm { font-size: 0.8rem; }
  .text-m { font-size: 1rem; }
  .text-lg { font-size: 1.2rem; }
  */
</style>
