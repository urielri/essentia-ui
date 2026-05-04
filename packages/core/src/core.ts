// essentia-core — Runtime: engine, scene graph, viewport, camera.
// Layer foundational: NO incluye primitivas visuales (eso vive en
// essentia-styles) ni componentes structurales (eso vive en essentia-ui).

// Componente raíz
export { default as EssentiaRoot } from './lib/components/essentia-root.svelte'
export type { EnvironmentOptions } from './lib/components/essentia-root.types.js'

// Nodos (clase base)
export { EssentiaNode } from './lib/nodes/essentia-node.js'
export type { Anchor, Bounds, Disposable } from './lib/nodes/essentia-node.js'

// Engine (estado central de la escena)
export { useEngine } from './lib/core/engine.svelte.js'
export type { Engine, Viewport } from './lib/core/engine.svelte.js'

// Utilidades de cámara
export { worldToScreen, screenToWorld } from './lib/core/camera.js'
