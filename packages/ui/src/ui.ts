// Componentes
export { default as EssentiaRoot } from './lib/components/essentia-root.svelte'

// Nodos
export { EssentiaNode } from './lib/nodes/essentia-node.js'
export type { Anchor, Bounds } from './lib/nodes/essentia-node.js'

// Engine (para componentes que necesiten acceder al estado del engine)
export { useEngine } from './lib/core/engine.svelte.js'
export type { Engine, Viewport } from './lib/core/engine.svelte.js'

// Utilidades de cámara (útiles para Ghost Inputs y raycasting)
export { worldToScreen, screenToWorld } from './lib/core/camera.js'
