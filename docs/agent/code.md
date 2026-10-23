# Código: convenciones generales

Leé esta guía antes de escribir o revisar código en cualquier workspace. Lo específico del stack Essentia (capas, nodos, shaders, demos) está en [`essentia.md`](./essentia.md) y lo de Telar en [`telar.md`](./telar.md).

Estas reglas salen de lo que ya hace la mayor parte del repo. Si encontrás código que no las sigue, no lo corrijas de paso: respetá la regla en lo que escribís y avisá.

## Idioma

| Qué                                                              | Idioma                                      |
| ---------------------------------------------------------------- | ------------------------------------------- |
| Identificadores, nombres de archivos y carpetas                  | Inglés                                      |
| Comentarios, JSDoc y comentarios de markup (`<!-- … -->`)        | Español                                     |
| Títulos de `describe` / `it`                                     | Español                                     |
| Mensajes de `Error`                                              | Español, con prefijo `[Essentia]` o `[Telar]` |

Ejemplo de error: `throw new Error('[Essentia] useEngine() debe llamarse dentro de un EssentiaRoot')`.

## Archivos y estructura

- **Nombres en kebab-case** en Essentia y en `apps/web-svelte`: `glass-node.ts`, `essentia-root.svelte`, `glass-button.config.ts`. Los componentes Svelte se importan en PascalCase (`import Glass from './glass.svelte'`), pero el archivo queda en kebab-case.
- **Sufijos:**
  - `*.test.ts`: tests de Vitest;
  - `*.svelte.ts`: módulos con runes fuera de un componente (`engine.svelte.ts`);
  - `*.types.ts`: tipos públicos de un componente (`essentia-root.types.ts`);
  - `*.config.ts`: lógica pura de un componente, testeable sin renderizar (`glass-button.config.ts`);
  - `*.uniforms.ts`, `*.vert.glsl`, `*.frag.glsl`: shaders (ver [`essentia.md`](./essentia.md)).
- **Tests en `__tests__/`** junto al módulo que prueban (`src/nodes/__tests__/glass-node.test.ts`). La config de Vitest de los paquetes Essentia solo toma `src/**/__tests__/**/*.test.ts`: un test fuera de ahí no corre.
- **Barrel por paquete:** `core.ts`, `styles.ts`, `ui.ts`. Agrupá los exports por sección con un comentario (`// Nodos visuales`) y exportá los tipos con `export type`.
- **Excepción:** `@repo/telar` y `apps/telar` usan PascalCase para componentes React y camelCase para hooks (`TelarRoot.tsx`, `useKnot.ts`). Ver [`telar.md`](./telar.md).

## Imports

- **Extensión `.js` en imports relativos de TypeScript** en los paquetes Essentia (`from './nodes/glass-node.js'`). Los `.svelte` y `.glsl` se importan con su extensión real.
- **En Telar, sin extensión** (`from '../core/knot'`).
- **Entre workspaces, siempre por nombre de paquete** (`from 'essentia-core'`), nunca con una ruta relativa a otro workspace.
- **Tipos:** con `import type` o con `type` inline (`import { x, type Y }`). Los paquetes Svelte tienen `verbatimModuleSyntax`, así que un tipo importado sin `type` rompe el build.

## Declaraciones y tipos

- **Exports con nombre.** `export default` solo donde el framework o la herramienta lo exige (componentes `.svelte` por definición, `vite.config.ts`, `svelte.config.js`, páginas de Next, declaraciones de módulo `.glsl`).
- **`type` para formas de datos** (`GlassNodeOptions`, `Bounds`, `GlassUniforms`). **`interface`** para contratos que otra clase implementa (`Disposable`) y para `Props` de componentes Svelte, como hace el código actual.
- **Sin `enum`.** Usá uniones de strings (`'primary' | 'secondary' | 'ghost'`).
- **Clases para nodos y recursos con ciclo de vida;** funciones puras para todo lo demás. Los campos privados llevan prefijo `_` (`_bounds`, `_children`) y se exponen con getters de solo lectura.
- **Defaults documentados:** cada opción opcional lleva su `@default` en el JSDoc y el mismo valor en el código. Si cambiás uno, cambiá el otro.
- **Prohibido:** `any`, `@ts-ignore` y `@ts-expect-error` sin un comentario que explique por qué. El non-null `!` solo en tests.

## Nombres

- Variables y funciones en camelCase; tipos, clases y componentes en PascalCase.
- **Setters de nodos:** `setXxx(...)`, devuelven `this` (encadenables).
- **Hooks de contexto:** `useXxx()` (`useEngine()`), y lanzan un error con prefijo si se usan fuera de su proveedor.
- **Unidades en el JSDoc** cuando no son obvias: píxeles CSS, píxeles físicos (CSS × DPR), rango normalizado (`[0..1]`), segundos.

## Comentarios

- **En español, explicando el porqué:** invariantes, decisiones no obvias, limitaciones de una librería y excepciones a una regla. No describas lo que el código ya dice.
- **JSDoc completo en la API pública:** cada prop, opción y método exportado lleva su descripción, unidades y `@default`. Es la documentación que leen los consumidores.
- **Si te apartás de una regla a propósito** (p. ej. mezclar lógica CPU y GPU), dejá un comentario con el motivo.
- **Sin `TODO` ni `FIXME` en el código:** lo pendiente va al roadmap o a las decisiones pendientes del `concept.md` correspondiente.

## Tests

- **Runner:** Vitest con `describe` / `it` / `expect` (y `vi` para mocks), importados explícitamente desde `vitest`.
- **Entorno `node`:** los componentes `.svelte` no se testean. Por eso la lógica testeable vive en nodos (`*-node.ts`) o en funciones puras (`*.config.ts`), y el componente solo orquesta.
- **Títulos:** `describe('GlassNode — construcción')`, `it('aplica defaults cuando no se proveen props opcionales')`.
- **Qué cubrir:** defaults, cada setter (valor en el uniform o en el objeto de Three.js), `destroy()` liberando los disposables, y todo bug corregido.
- **Cobertura mínima:** funciones puras al 100 %, clases al 80 % o más.

## Formato

- **Estilo del código actual:** 2 espacios, comillas simples, sin punto y coma y con trailing comma en literales multilínea. Respetalo en lo que escribas.
- **`@repo/prettier-config` no refleja ese estilo** (pide punto y coma y comillas dobles) y ningún workspace lo usa. No corras Prettier con esa configuración sobre archivos existentes: reformatearía todo. Cambiar la configuración de formato es configuración compartida: preguntá antes.
- **No mezcles formato con lógica** en un mismo commit.
