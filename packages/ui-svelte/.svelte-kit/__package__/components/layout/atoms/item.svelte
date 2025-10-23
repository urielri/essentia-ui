<script lang="ts">
  // Las propiedades de Svelte necesitan ser exportadas
  import Icon from "#core/particles/icon.svelte";
  import Text from "#core/particles/text.svelte";

  // El ícono es ahora un Componente Svelte (clase o función constructora)
  export let icon: any;
  export let label: string | undefined = undefined;
  // CSSProperties en React se convierte en un string de CSS o un objeto en Svelte
  export let style: string | undefined = undefined;
  export let ariaLabel: string;
  export let selected: boolean = false;
  // La función de manejo de eventos es la misma
  export let onClick: ((e: MouseEvent) => void) | undefined = undefined;

  // Lógica de manejo de click
  function handleClick(event: MouseEvent) {
    if (onClick) {
      onClick(event);
    }
  }
</script>

<div
  class="item"
  role="button"
  tabindex="-1"
  class:selected
  aria-label={ariaLabel}
  {style}
  on:click={handleClick}
>
  <Icon className="icon">
    <svelte:component this={icon} />
  </Icon>

  {#if label}
    <Text className="text">{label}</Text>
  {/if}
</div>

<style>
  .item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--size);
    padding: var(--size);
    border-radius: var(--border-radius);
    height: min-content;
    flex: 0;
    transition: all var(--transition-duration) var(--transition-mode);
    cursor: pointer;
    &:hover {
      :global(.icon) {
        transform: translateX(1px);
      }
    }
    :global(.icon) {
      transition: transform var(--transition-duration) var(--transition-mode);
    }
    :global(.text) {
      color: var(--white);
      font-weight: 600;
      font-size: 14px;
      line-height: 22px;
    }
  }

  .selected {
    background-color: var(--glass-surface);
    border-radius: var(--border-radius);
    backdrop-filter: blur(var(--blur));
    &:hover {
      filter: none;
    }
  }
</style>
