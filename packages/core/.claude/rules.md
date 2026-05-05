---
name: Essentia Core — Rules
description: Convenciones y restricciones del stack Essentia
---

# Rules

Estas reglas aplican al **stack completo** (`essentia-core`, `essentia-styles`,
`essentia-ui`). Viven en `essentia-core` por ser la capa base, pero se
respetan en todos los paquetes y demos consumidores.

## Convenciones de archivos

- Archivos en **kebab-case**: `glass-node.ts`, `essentia-root.svelte`,
  `refraction-pass.glsl`
- Componentes Svelte en **PascalCase solo en la importación**, el archivo
  en kebab-case
- Shaders en **archivos `.glsl` separados**, nunca como template literals
  inline en `.ts` o `.svelte`. Viven en `essentia-styles`.
- Un shader por archivo. Si comparten código, usar `#include` o módulos
  GLSL explícitos

## Boundaries entre paquetes

- `essentia-core` NO importa de styles ni ui.
- `essentia-styles` importa de core (vía nombre de paquete: `from
  'essentia-core'`), NO de ui.
- `essentia-ui` puede importar de styles y core; nunca al revés.
- Cualquier import cross-package usa el nombre del paquete, no rutas
  relativas (e.g. `from 'essentia-core'`, no `from '../../core/src/...'`).

## Separación CPU / GPU

La separación entre lógica Svelte y lógica GPU debe ser **total por
defecto**, en cualquier paquete que tenga ambas (típicamente styles).

**Lógica Svelte (CPU):**
- Estado reactivo (`$state`, `$derived`, `$effect`)
- Eventos del usuario (click, keyboard, focus)
- Comunicación con Hybrid Bridge / Ghost Inputs
- Ciclo de vida de componentes

**Lógica GPU:**
- Geometría, materiales, uniforms
- Shaders GLSL/WGSL
- RenderTargets, postprocesado
- Transforms matriciales, scene graph

Si por razones técnicas es necesario mezclar (ej: leer una medición del
canvas para calcular un uniform), documentarlo explícitamente con un
comentario que justifique la excepción.

El patrón canónico es: **Node** (lógica GPU pura, en un `.ts` puro) +
**Shell `.svelte`** (orquesta props → setters del nodo en un `$effect`).
Ver `GlassNode` + `glass.svelte` como referencia.

## Shaders (en `essentia-styles`)

- Los uniforms deben estar tipados en TypeScript en un archivo paralelo
  al `.glsl` (ej: `glass.uniforms.ts`)
- Nombrar uniforms en `camelCase` con prefijo `u_`: `u_time`,
  `u_resolution`, `u_ior`
- Nombrar varyings con prefijo `v_`: `v_uv`, `v_normal`
- Nombrar attributes con prefijo `a_`: `a_position`, `a_uv`
- Incluir comentario de unidades en uniforms que lo requieran:
  `// seconds`, `// pixels`

## EssentiaNode

- Todo nodo que represente un elemento visual debe extender o instanciar
  `EssentiaNode` (importado desde `essentia-core`).
- No crear `Mesh` sueltos como primitivos visuales — siempre encapsulados
  en un `Node`.
- El `EssentiaNode` es responsable de su propio bounds y anchoring; no
  calcularlo afuera.
- Recursos GPU (geometry, material, render targets) se registran con
  `addDisposable()` para liberación automática en `destroy()`.

## Composición de primitivas

- Las primitivas visuales (`<Glass>`, `<Rect>`, `<Image>`, futuro
  `<Text>`) son **ortogonales**: ninguna acepta children de UI.
- Composición se hace declarando hermanos en world space, o como hijos
  de un `<Box>` de `essentia-ui`.
- Patrones recurrentes (e.g. "Glass + Text + onclick" = Button) viven
  en `essentia-ui` como componentes higher-level, no en las primitivas.

## Tests

- Framework: **Vitest**.
- `essentia-core`: tests para `EssentiaNode`, math (sdf), camera utils.
- `essentia-styles`: tests para nodes (`GlassNode`, futuro `TextNode`).
  Componentes `.svelte` no se testean en Node env.
- `essentia-ui`: sin tests por ahora (solo re-exports).
- Cobertura mínima: funciones puras al 100%, clases al 80%+.

## Lo que nunca hacer

- No sugerir `backdrop-filter`, `box-shadow`, `border-radius` CSS como
  solución a problemas visuales — todo efecto visual va en shader.
- No proponer componentes HTML como superficie de renderizado principal.
  El DOM es bridge a11y/eventos, no superficie de render.
- No usar `innerHTML` ni manipulación directa del DOM fuera del Hybrid
  Bridge / Ghost Inputs.
- No importar React, Vue ni ninguna otra librería de UI externa.
- No usar `any` en TypeScript sin justificación explícita.
- No crear geometría Three.js (`BoxGeometry`, `PlaneGeometry`) sin evaluar
  primero si un SDF en shader es más apropiado.
- No mezclar capas: `essentia-core` no debe importar Glass/Rect/Image.

## Performance

- Minimizar draw calls: agrupar geometría cuando sea posible (instancing,
  merging).
- Los `$effect` que toquen uniforms deben ejecutarse dentro del loop de
  Threlte (`useTask`) cuando hay sincronización con el render frame.
- Evitar allocations en el render loop: no crear objetos
  `new THREE.Vector3()` por frame.
- Los RenderTargets deben tener resolución explícita (en píxeles físicos =
  CSS × DPR), nunca depender de defaults.
