/**
 * Declaración ambient para imports de archivos `.glsl`, `.vert` y `.frag`.
 * `vite-plugin-glsl` los transforma en módulos cuyo default export es el
 * source GLSL como `string` (con `#include` resueltos).
 */
declare module '*.glsl' {
  const source: string
  export default source
}

declare module '*.vert' {
  const source: string
  export default source
}

declare module '*.frag' {
  const source: string
  export default source
}
