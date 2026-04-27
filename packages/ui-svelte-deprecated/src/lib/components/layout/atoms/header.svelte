<script lang="ts">
  // 1. IMPORTACIONES
  // Las dependencias internas (Col, Icon, Text, GlassBox) deben ser componentes Svelte
  import Col from "#core/particles/col.svelte";
  //import GlassBox from "#components/glass/glass-box/glassBox.svelte";
  import GlassBox from "#core/glass/box.svelte";

  // Componentes locales
  import Item from "./item.svelte";
  import Logo from "./logo.svelte";

  // Iconos definidos al final del archivo original
  import HomeIcon from "./icons/home.svelte";
  import StoreIcon from "./icons/store.svelte";
  import SubscriptionIcon from "./icons/subscription.svelte";
  import MenuIcon from "./icons/menu.svelte";

  // 2. PROPS (Definición con valores por defecto)
  export let type: "full" | "compact" = "compact";
  export let corners: "rounded" | "middle" = "rounded";

  // 3. DATOS CONSTANTES
  const items = [
    { icon: HomeIcon, text: "Inicio", ariaLabel: "home", path: "/" },
    { icon: StoreIcon, text: "Tienda", ariaLabel: "store", path: "/store" },
    {
      icon: SubscriptionIcon,
      text: "Suscripción",
      ariaLabel: "subscription",
      path: "/subscription",
    },
  ];
  const menuItem = {
    icon: MenuIcon,
    ariaLabel: "menu",
    style: "flex: 0; width: min-content;", // Convertido a string CSS
  };
</script>

<header
  class={`full-width header ${type === "full" ? "glass" : ""} ${type} ${corners}`}
>
  <Col class="container" style="width: 100%;">
    <div class="logo">
      <Logo />
    </div>

    {#if type === "compact"}
      <GlassBox className="items">
        {#each items as item}
          <Item icon={item.icon} label={item.text} ariaLabel={item.ariaLabel} />
        {/each}
      </GlassBox>
    {:else}
      <div class="items">
        {#each items as item}
          <Item icon={item.icon} label={item.text} ariaLabel={item.ariaLabel} />
        {/each}
      </div>
    {/if}
    <GlassBox className="items">
      <Col class="menu item {type === 'compact' ? 'glass' : ''}">
        <Item
          icon={menuItem.icon}
          ariaLabel={menuItem.ariaLabel}
          style={menuItem.style}
        />
      </Col>
    </GlassBox>
  </Col>
</header>

<style>
  .header {
    --border-radius: calc(var(--size) * 6);
    --border-d: var(--border);
    --background: var(--glass-surface);
    --shadow: var(--shadow-glass);
    max-height: 60px;
    height: 60px;
    display: flex;
    align-self: center;
    gap: var(--size);
    z-index: 100;
    transition: all var(--transition-duration) var(--transition-mode);
    position: sticky;
    & :global(.container) {
      display: flex;
      align-self: center;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: calc(var(--size) * 2);
    }
    & :global(.items) {
      height: 100%;
      display: flex;
      gap: var(--size);
      align-items: center;
      width: min-content;
      flex: 0;
    }
  }
  .full {
    top: 0px;
    border-left: none;
    border-right: none;
    & :global(.menu) {
      border-radius: calc(var(--size) * 2);
      height: 80%;
    }
  }

  .compact {
    top: 5px;
    & .items {
      border-radius: var(--border-radius);
    }
  }
  /*

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
    & span {
      visibility: hidden;
      color: var(--white);
      font-weight: 600;
      font-size: 14px;
      line-height: 22px;
    }
    &:hover {
      & .icon {
        transform: translateX(1px);
      }
    }
    & .icon {
      transition: transform var(--transition-duration) var(--transition-mode);
    }
  }

  */
  .selected {
    &:hover {
      filter: none;
    }
  }

  .container {
    width: 100%;
  }
  .logo {
    & :global(svg) {
      filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.7));
      & :global(path) {
        fill: var(--white);
      }
    }
  }
</style>
