// Re-exports de @threlte/flex (Yoga via threlte) — capa de orquestación
// declarativa de layouts. Coexiste con el sistema absoluto de essentia-core
// (anchoring/setPosition).
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
// de Flex — evita cálculo manual de offsets contra Yoga.
export { Align } from '@threlte/extras'
