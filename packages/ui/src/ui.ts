// essentia-ui — Componentes estructurales (layout + higher-level components).

// Layout primitivas (re-exports de @threlte/flex)
export * from './layout/layout.js'

// Higher-level components: composición de primitivas de essentia-styles.
export { default as GlassButton } from './components/glass-button.svelte'
export { default as Card } from './components/card.svelte'

// Tipos públicos de configuración
export { buildGlassButtonState } from './components/glass-button.config.js'
export type {
  GlassButtonVariant,
  GlassButtonState,
  GlassButtonStateInput,
} from './components/glass-button.config.js'
