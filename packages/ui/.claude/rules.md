---
name: Essentia UI — Rules
description: Reglas de código, convenciones y restricciones del proyecto
---

# Rules

## Convenciones de archivos

- Archivos en **kebab-case**: `glass-material.ts`, `essentia-node.svelte`, `refraction-pass.glsl`
- Componentes Svelte en **PascalCase solo en la importación**, el archivo en kebab-case
- Shaders en **archivos `.glsl` separados**, nunca como template literals inline en `.ts` o `.svelte`
- Un shader por archivo. Si comparten código, usar `#include` o módulos GLSL explícitos

## Separación CPU / GPU

La separación entre lógica Svelte y lógica GPU debe ser **total por defecto**.

**Lógica Svelte (CPU):**
- Estado reactivo (`$state`, `$derived`, `$effect`)
- Eventos del usuario (click, keyboard, focus)
- Comunicación con el Shadow Layer / Ghost Inputs
- Ciclo de vida de componentes

**Lógica GPU:**
- Geometría, materiales, uniforms
- Shaders GLSL/WGSL
- RenderTargets, postprocesado
- Transforms matriciales, scene graph

Si por razones técnicas es necesario mezclar (ej: leer una medición del canvas para calcular un uniform), documentarlo explícitamente con un comentario que justifique la excepción.

## Shaders

- Los uniforms deben estar tipados en TypeScript en un archivo paralelo al `.glsl`
- Nombrar uniforms en `camelCase` con prefijo `u_`: `u_time`, `u_resolution`, `u_ior`
- Nombrar varyings con prefijo `v_`: `v_uv`, `v_normal`
- Nombrar attributes con prefijo `a_`: `a_position`, `a_uv`
- Incluir comentario de unidades en uniforms que lo requieran: `// seconds`, `// pixels`

## EssentiaNode

- Todo nodo que represente un elemento de UI debe extender o instanciar `EssentiaNode`
- No crear `Mesh` sueltos como primitivos de UI — siempre encapsulados en un nodo
- El `EssentiaNode` es responsable de su propio bounds y anchoring; no calcularlo afuera

## Tests

- Tests solo para `core/`: store, graph, math, tipos
- Los tests de componentes visuales están fuera de scope hasta nueva indicación
- Framework: **Vitest**
- Cobertura mínima esperada en core: funciones puras al 100%, stores al 80%+

## Lo que nunca hacer

- No sugerir `backdrop-filter`, `box-shadow`, `border-radius` CSS como solución a problemas visuales — todo efecto visual va en shader
- No proponer componentes HTML como superficie de renderizado principal
- No usar `innerHTML` ni manipulación directa del DOM fuera del Shadow Layer / Ghost Inputs
- No importar React, Vue ni ninguna otra librería de UI externa
- No usar `any` en TypeScript sin justificación explícita
- No crear geometría Three.js (`BoxGeometry`, `PlaneGeometry`) sin evaluar primero si un SDF en shader es más apropiado

## Performance

- Minimizar draw calls: agrupar geometría cuando sea posible (instancing, merging)
- Los `$effect` que toquen uniforms deben ejecutarse dentro del loop de Threlte (`useTask`), no fuera
- Evitar allocations en el render loop: no crear objetos `new THREE.Vector3()` por frame
- Los RenderTargets deben tener resolución explícita, nunca depender de defaults
