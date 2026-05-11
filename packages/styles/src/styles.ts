// Componentes visuales (primitivas GPU)
export { default as Rect } from './components/rect.svelte'
export { default as Image } from './components/image.svelte'
export { default as Glass } from './components/glass.svelte'
export { default as Text } from './components/text.svelte'

// Nodos visuales
export { GlassNode } from './nodes/glass-node.js'
export type { GlassNodeOptions } from './nodes/glass-node.js'
export { TextNode } from './nodes/text-node.js'
export type { TextNodeOptions, TextAlignment, AnchorNormalized } from './nodes/text-node.js'
