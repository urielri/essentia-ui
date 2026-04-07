// Componentes
export { default as EssentiaRoot } from './lib/components/essentia-root.svelte'
export type { EnvironmentOptions } from './lib/components/essentia-root.types.js'
export { default as Rect } from './lib/components/rect.svelte'
export { default as Image } from './lib/components/image.svelte'
export { default as Glass } from './lib/components/glass.svelte'
export { default as GlassPlayground } from './lib/components/glass-playground.svelte'

// Nodos
export { EssentiaNode } from './lib/nodes/essentia-node.js'
export type { Anchor, Bounds, Disposable } from './lib/nodes/essentia-node.js'
export { GlassNode } from './lib/nodes/glass-node.js'
export type { GlassNodeOptions } from './lib/nodes/glass-node.js'

// Engine (para componentes que necesiten acceder al estado del engine)
export { useEngine } from './lib/core/engine.svelte.js'
export type { Engine, Viewport } from './lib/core/engine.svelte.js'

// Utilidades de cámara (útiles para Ghost Inputs y raycasting)
export { worldToScreen, screenToWorld } from './lib/core/camera.js'
