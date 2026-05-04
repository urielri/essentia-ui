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

// Layout (Yoga via @threlte/flex). Capa opcional de orquestación declarativa
// sobre el sistema absoluto world-space. Se re-exporta desde essentia/ui para
// que los consumidores tengan un único import surface y no necesiten conocer
// la dependencia subyacente.
export {
  Flex,
  Box,
  useReflow,
  useDimensions,
  tailwindParser,
  createClassParser,
} from '@threlte/flex'
export type { NodeProps as FlexNodeProps } from '@threlte/flex'

// Align: posiciona el centro de un subtree en (x, y, z). Complemento natural
// de Flex — evita cálculo manual de offsets contra el sistema de coordenadas
// interno de Yoga.
export { Align } from '@threlte/extras'
