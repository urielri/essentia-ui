# Refactor 3-layer: core / styles / ui
## Contexto
El paquete actual `packages/ui` (publicado como `essentia`) mezcla tres responsabilidades: runtime/engine, primitivas visuales (Glass, Rect, Image) y estructura/layout. El usuario decidió separarlas en tres paquetes ortogonales **antes** de iniciar Fase 4 para que MSDF Text aterrice en el paquete correcto desde día 1.
## Estado actual
* 1 paquete `essentia` (`packages/ui`, version `0.1.0`).
* Working tree con cambios sin commitear: integración de Environment / Suspense / Interactivity / useTexture / Glass events / cursor / refactor a `GlassNode` / re-exports de `@threlte/flex` y `Align`.
* App `apps/web-svelte` consume vía `import { ... } from 'essentia/ui'`.
* `glass-playground.svelte` vive en la lib pero no es API pública — es demo.
## Decisiones aprobadas
1. Tres paquetes: `essentia-core`, `essentia-styles`, `essentia-ui` (Opción C, unscoped).
2. Versiones iniciales: `core@0.1.0`, `styles@0.1.0`, `ui@0.0.0`.
3. `Flex` / `Box` / `Align` viven en `ui` (no en `core`).
4. `GlassPlayground` se mueve a `apps/web-svelte` (sale de la lib).
5. Estrategia: big-bang en una rama dedicada, mergeada cuando todo pase.
## Distribución final de archivos
### `packages/core/` (nuevo, contiene lo del actual `packages/ui` reducido a runtime)
```warp-runnable-command
packages/core/
├── package.json                            # name: "essentia-core", version 0.1.0
├── vite.config.ts                          # solo test config (sin glsl plugin)
├── tsconfig.json
├── CHANGELOG.md                            # historial filtrado a items de core
├── README.md
├── WARP.md
├── .claude/                                # concept/rules/soul movidos acá
└── src/
    ├── components/
    │   ├─ essentia-root.svelte
    │   └─ essentia-root.types.ts
    ├── core/
    │   ├─ engine.svelte.ts
    │   ├─ ortho-camera.svelte
    │   ├─ background-capture.svelte
    │   ├─ background-capture.ts
    │   ├─ scene-background.svelte
    │   ├─ interactivity.svelte
    │   ├─ camera.ts
    │   └─ __tests__/camera.test.ts
    ├── math/
    │   ├─ sdf.ts
    │   └─ __tests__/sdf.test.ts
    ├── nodes/
    │   ├─ essentia-node.ts                  # solo la base
    │   └─ __tests__/essentia-node.test.ts
    └── core.ts                              # entry point
```
Exporta: `EssentiaRoot`, `EssentiaNode`, `useEngine`, `worldToScreen`, `screenToWorld`, `EnvironmentOptions`, `Disposable`, `Anchor`, `Bounds`, `Engine`, `Viewport`.
### `packages/styles/` (nuevo, recibe primitivas visuales)
```warp-runnable-command
packages/styles/
├── package.json                            # name: "essentia-styles", version 0.1.0
├── vite.config.ts                          # con glsl plugin + tests
├── tsconfig.json
├── CHANGELOG.md                            # historial filtrado a items visuales
├── README.md                               # nuevo
├── WARP.md                                 # nuevo, apunta a .claude/
├── .claude/concept.md                      # nuevo, modelo "primitivas visuales"
└── src/
    ├── components/
    │   ├─ glass.svelte
    │   ├─ rect.svelte
    │   └─ image.svelte
    ├── nodes/
    │   ├─ glass-node.ts
    │   └─ __tests__/glass-node.test.ts
    ├── shaders/
    │   ├─ glass.vert.glsl
    │   ├─ glass.frag.glsl
    │   ├─ glass.uniforms.ts
    │   ├─ sdf-rect.vert.glsl
    │   ├─ sdf-rect.frag.glsl
    │   ├─ sdf-rect.uniforms.ts
    │   └─ image.frag.glsl
    ├── glsl.d.ts
    └── styles.ts                            # entry point
```
Exporta: `Glass`, `Rect`, `Image`, `GlassNode`, `GlassNodeOptions`. **NO** `GlassPlayground` (movido a app).
### `packages/ui/` (rebuilt, scope reducido)
```warp-runnable-command
packages/ui/
├── package.json                            # name: "essentia-ui", version 0.0.0
├── tsconfig.json
├── CHANGELOG.md                            # vacío, listo para componentes futuros
├── README.md                               # nuevo, explica scope (structural components)
├── WARP.md
├── .claude/concept.md                      # nuevo, modelo "structural components"
└── src/
    ├── layout/
    │   └─ layout.ts                        # re-exports de @threlte/flex + Align
    └── ui.ts                                # entry point
```
Exporta: `Flex`, `Box`, `Align`, `useReflow`, `useDimensions`, `tailwindParser`, `createClassParser`, `FlexNodeProps`.
### `apps/web-svelte/`
* Mover `packages/ui/src/lib/components/glass-playground.svelte` a `apps/web-svelte/src/routes/playground/glass-playground.svelte` (local al consumidor de ese demo).
* Actualizar todos los imports `'essentia/ui'` a los nuevos packages según corresponda:
    * `EssentiaRoot`, `useEngine`, `worldToScreen`, `screenToWorld` → `'essentia-core'`
    * `Glass`, `Rect`, `Image` → `'essentia-styles'`
    * `Flex`, `Box`, `Align`, etc. → `'essentia-ui'`
* Actualizar `package.json` para declarar dependencias en los tres workspaces.
## Dependencias entre packages
```warp-runnable-command
essentia-core   → @threlte/core, @threlte/extras, three, svelte
essentia-styles → essentia-core, @threlte/core, @threlte/extras, three, svelte
essentia-ui     → @threlte/flex, @threlte/extras, svelte
```
`essentia-ui` no depende de core ni de styles — solo provee layout. Si en el futuro un componente structural (Button) usa Glass, agregar `essentia-styles` a sus deps.
## Ejecución paso a paso
### Step 1: Branch y backup
* `git checkout -b refactor/3-layer-split`
* Stash o commit primero los cambios pending (working tree no vacío) en un commit `wip:` para no perderlos durante el move.
### Step 2: Renombrar `packages/ui` → `packages/core`
* `git mv packages/ui packages/core`
* Editar `packages/core/package.json`: `"name": "essentia"` → `"name": "essentia-core"`. Cambiar `exports` de `"./ui"` a `"."` apuntando a `./src/core.ts`.
* Renombrar `src/ui.ts` → `src/core.ts`.
### Step 3: Crear `packages/styles/` y mover primitivas visuales
* `mkdir -p packages/styles/src/{components,nodes,shaders}`
* `mkdir -p packages/styles/src/nodes/__tests__`
* `git mv packages/core/src/lib/components/{glass,rect,image}.svelte packages/styles/src/components/`
* `git mv packages/core/src/lib/nodes/glass-node.ts packages/styles/src/nodes/`
* `git mv packages/core/src/lib/nodes/__tests__/glass-node.test.ts packages/styles/src/nodes/__tests__/`
* `git mv packages/core/src/lib/shaders/* packages/styles/src/shaders/`
* `git mv packages/core/src/glsl.d.ts packages/styles/src/glsl.d.ts`
* Crear `packages/styles/src/styles.ts` con exports de `Glass`, `Rect`, `Image`, `GlassNode`, `GlassNodeOptions`.
* Crear `packages/styles/package.json` con name `essentia-styles`, version `0.1.0`, deps correctas, `exports` apuntando a `./src/styles.ts`.
* Copiar `packages/core/vite.config.ts` a `packages/styles/vite.config.ts` (mantener glsl plugin + test config).
* Copiar `packages/core/tsconfig.json` a `packages/styles/tsconfig.json`.
### Step 4: Crear `packages/ui/` (nuevo, vacío de componentes)
* `mkdir -p packages/ui/src/layout`
* Crear `packages/ui/src/layout/layout.ts` con re-exports de `@threlte/flex` (Flex, Box, useReflow, useDimensions, tailwindParser, createClassParser, FlexNodeProps) y `@threlte/extras` (Align).
* Crear `packages/ui/src/ui.ts` que re-exporta `./layout/layout.js`.
* Crear `packages/ui/package.json` con name `essentia-ui`, version `0.0.0`, deps en `@threlte/flex`, `@threlte/extras`, `svelte`. `exports` apuntando a `./src/ui.ts`.
* Crear `packages/ui/tsconfig.json`.
### Step 5: Limpiar `packages/core`
* Remover de `packages/core/src/core.ts` los exports que migraron a styles/ui.
* `packages/core/src/core.ts` debe exportar SOLO: `EssentiaRoot`, `EnvironmentOptions`, `EssentiaNode`, `Disposable`, `Anchor`, `Bounds`, `useEngine`, `Engine`, `Viewport`, `worldToScreen`, `screenToWorld`.
* Quitar `glsl plugin` de `packages/core/vite.config.ts` (no quedan shaders ahí).
* Quitar dependencias innecesarias del `package.json` de core que solo usaban Glass/Rect/Image.
### Step 6: Actualizar imports cross-package en código migrado
* `packages/styles/src/components/glass.svelte`: `import { useEngine } from '../core/engine.svelte.js'` → `import { useEngine } from 'essentia-core'`. Mismo para `image.svelte`, `rect.svelte`.
* `packages/styles/src/nodes/glass-node.ts`: `import { EssentiaNode } from './essentia-node.js'` → `import { EssentiaNode } from 'essentia-core'`.
* `packages/styles/src/nodes/__tests__/glass-node.test.ts`: ajustar import de `EssentiaNode` si lo usa.
* Tests de styles deben poder resolver `essentia-core` vía npm workspace symlink.
### Step 7: Mover GlassPlayground a apps/web-svelte
* `git mv packages/styles/src/components/glass-playground.svelte apps/web-svelte/src/routes/playground/glass-playground.svelte` (si quedó en styles tras Step 3, o si está en core, mover desde ahí).
* Actualizar `apps/web-svelte/src/routes/playground/+page.svelte` para importar localmente.
### Step 8: Actualizar imports en `apps/web-svelte`
Reemplazar todos los `from 'essentia/ui'` por los packages correctos:
* `EssentiaRoot`, `useEngine`, `worldToScreen`, `screenToWorld` → `from 'essentia-core'`
* `Rect`, `Glass`, `Image` → `from 'essentia-styles'`
* `Flex`, `Box`, `Align`, `tailwindParser`, etc. → `from 'essentia-ui'`
Archivos afectados (mínimo conocido):
* `apps/web-svelte/src/routes/+page.svelte`
* `apps/web-svelte/src/routes/product/+page.svelte`
* `apps/web-svelte/src/routes/playground/+page.svelte`
* `apps/web-svelte/src/routes/flex-demo/+page.svelte` y `scene.svelte`
* `apps/web-svelte/package.json` — reemplazar la dep `"essentia": "*"` por las tres nuevas.
### Step 9: Workspaces y npm install
* Verificar `package.json` raíz tiene `"workspaces": ["apps/*", "packages/*"]` (sin cambios).
* `npm install` para regenerar symlinks de los nuevos packages.
* Verificar que `node_modules/essentia-core`, `essentia-styles`, `essentia-ui` están simlinkeados al workspace.
### Step 10: Documentación
* Mover `packages/core/.claude/` (concept/rules/soul) intactos — siguen describiendo el modelo conceptual.
* Crear `packages/styles/.claude/concept.md` con foco en "primitivas visuales: shape SDF, materiales, efectos GPU".
* Crear `packages/ui/.claude/concept.md` con foco en "structural components y layout".
* Mover `packages/core/CHANGELOG.md` filtrando solo items de core; crear `packages/styles/CHANGELOG.md` con items visuales (Glass, Rect, Image, refactor a GlassNode, fixes DPR/refracción/SDF AA, useTexture en Image, env props del Glass shader).
* `packages/ui/CHANGELOG.md` queda con `[Unreleased]` vacío o con "Inicial: re-exports de @threlte/flex + Align".
* Actualizar root `WARP.md` para apuntar a los tres packages.
### Step 11: Verificación
* `cd packages/core && vitest run` — esperado: tests de essentia-node + camera + sdf pasan.
* `cd packages/styles && vitest run` — esperado: tests de glass-node pasan.
* `cd packages/ui && vitest run` (si hay tests) o skip.
* `svelte-check` en cada package — cero errores nuevos.
* `cd apps/web-svelte && npx vite build` — build exitoso, todas las rutas resuelven imports.
* Smoke visual en dev server: `/`, `/product`, `/playground`, `/flex-demo` — todas funcionan idénticas.
## Riesgos y mitigaciones
* **Imports circulares**: si styles importa de core y core importa algo de styles → error. Mitigación: core NO importa de styles. Verificar manualmente después del move.
* **Resolución de workspace npm**: en algunos shells o setups, el symlink de workspaces no se regenera automáticamente. Mitigación: borrar `node_modules/` raíz y `npm install` desde cero si los imports fallan.
* **`vite-plugin-glsl` solo en packages que lo necesitan**: core NO tiene shaders — quitar plugin de su vite.config. Si queda, no rompe nada pero es ruido.
* **Tests de glass-node usan vite/vitest**: necesitan que el plugin glsl esté activo en `packages/styles/vite.config.ts`. Verificar.
* **HMR cross-package en dev**: con `optimizeDeps.exclude: ["essentia"]` actual de Vite, tras la migración hay que cambiarlo a `["essentia-core", "essentia-styles", "essentia-ui"]` para mantener HMR fluido.
## Out of scope (no se hace en este refactor)
* Implementar MSDF Text — eso es Fase 4, después del merge del refactor.
* Crear componentes higher-level en `essentia-ui` (Button, Card) — cuando lleguen, agrega `essentia-styles` a sus deps.
* Migrar `Rect`/`Image` al patrón nodo (`RectNode`, `ImageNode`) — mantener su estructura actual durante el move; refactorearlos después.
* Publicación a npm — sigue siendo workspace privado, los packages solo se consumen vía symlink.
## Costo estimado
* Steps 1-5 (estructura + moves): ~1.5h.
* Steps 6-8 (imports cross-package): ~1h.
* Steps 9-10 (workspaces + docs): ~0.5h.
* Step 11 (verificación + fixes): ~1h.
* **Total: ~4h.**
