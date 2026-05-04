<script lang="ts">
  import type { Snippet } from 'svelte'
  import { interactivity } from '@threlte/extras'

  interface Props {
    children?: Snippet
  }

  let { children }: Props = $props()

  /**
   * Activa el sistema de eventos por raycasting de @threlte/extras.
   *
   * Importante: `interactivity()` registra el plugin en el componente actual
   * y solo es visible para los **descendientes Svelte** que se rendericen
   * adentro. Por eso este componente expone `children` y los wrappea —
   * llamarlo como sibling no propaga el contexto.
   *
   * Costo: el raycaster se ejecuta solo cuando hay objetos con handlers
   * registrados. Sin handlers, overhead efectivo cero.
   */
  interactivity()
</script>

{@render children?.()}
