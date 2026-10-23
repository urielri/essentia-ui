# AGENTS.md

Fuente única de verdad para cualquier agente que trabaje en este repo. El detalle por área está en [`docs/agent/`](docs/agent). La documentación para personas (READMEs, `CONCEPT.md`, `.claude/concept.md` de cada paquete, CHANGELOGs) sigue donde está: las guías de agente la enlazan, no la copian.

## Proyecto

Essentia es un framework **GPU-first** para construir aplicaciones (no páginas, no juegos) cuya interfaz se renderiza íntegramente en la GPU. El DOM no es la superficie de render: es una capa de soporte para accesibilidad y eventos nativos. Se organiza en tres capas (`essentia-core` → `essentia-styles` → `essentia-ui`) y avanza por fases; el roadmap vigente está en [`packages/core/README.md`](packages/core/README.md#roadmap-proyecto-completo).

El repo también aloja **Telar**, un manejador de estado reactivo para React basado en un grafo de dependencias, independiente del stack Essentia ([`packages/telar/README.md`](packages/telar/README.md)).

Los paquetes son workspaces privados: todavía no se publican a npm.

## Stack

- **Monorepo:** Turborepo 2 y npm workspaces (`apps/*`, `packages/*`) con un único `package-lock.json`. Node ≥ 24 (`.nvmrc`: 25) y npm 11.
- **Essentia:** Svelte 5 (runes) → Threlte 8 → Three.js 0.180 → WebGL 2. Layout opcional con `@threlte/flex` (Yoga). Texto MSDF con `troika-three-text`. Shaders GLSL cargados con `vite-plugin-glsl`.
- **Demos de Essentia:** SvelteKit 2 + Vite 7 (`apps/web-svelte`).
- **Telar y sus demos:** React 19 y Next.js 15 (`packages/telar`, `apps/telar`, `apps/docs`).
- **Tests:** Vitest 4.
- **Versionado:** Changesets configurado, pero los bumps y los CHANGELOGs se hacen a mano (ver [`docs/agent/git.md`](docs/agent/git.md)).

## Workspaces

| Workspace                       | Nombre npm                | Qué es                                                                      |
| ------------------------------- | ------------------------- | --------------------------------------------------------------------------- |
| `packages/core`                 | `essentia-core`           | Runtime: `EssentiaRoot`, engine, cámara ortográfica 1:1, `EssentiaNode`     |
| `packages/styles`               | `essentia-styles`         | Primitivas visuales GPU (`Glass`, `Rect`, `Image`, `Text`), nodos y shaders |
| `packages/ui`                   | `essentia-ui`             | Layout (`Flex`/`Box`/`Align`) y componentes higher-level (`GlassButton`…)   |
| `apps/web-svelte`               | `web-svelte`              | Demos de Essentia (`/`, `/playground`, `/text-demo`, `/components-demo`…)   |
| `packages/telar`                | `@repo/telar`             | Manejador de estado reactivo para React (knot, thread, bind)                |
| `apps/telar`                    | `telar`                   | Demos y documentación navegable de Telar (Next.js)                          |
| `apps/docs`                     | `docs`                    | App Next.js de documentación (plantilla inicial)                            |
| `packages/typescript-config`    | `@repo/typescript-config` | Configuración compartida de TypeScript                                      |
| `packages/eslint-config`        | `@repo/eslint-config`     | Configuración compartida de ESLint (solo la usan las apps Next)             |
| `packages/prettier-config`      | `@repo/prettier-config`   | Configuración de Prettier (no está conectada, ver `docs/agent/code.md`)     |
| `packages/vite-config`          | `@repo/vite-config`       | Configuración compartida de Vite/Vitest para Telar                          |
| `packages/ui-svelte-deprecated` | `@repo/ui-svelte`         | Implementación anterior. **Deprecada: no se toca ni se importa**            |

## Comandos

```bash
npm install                                         # instalar (único lockfile en la raíz)
npm run test --workspace=essentia-styles            # tests de un paquete (vitest run)
npm run check --workspace=essentia-styles           # svelte-check de un paquete Svelte
npm run dev:svelte --workspace=web-svelte           # demos de Essentia (Vite)
npm run dev --workspace=telar                       # demos de Telar (Next)
```

`turbo.json` solo declara `build`, `dev`, `dev:svelte` y `build:ui-svelte`: para `test` y `check` usá los scripts de cada workspace (ver [`docs/agent/traps.md`](docs/agent/traps.md)).

## Reglas transversales

- **Capas de Essentia:** `ui → styles → core`, nunca al revés. Entre paquetes se importa siempre por nombre (`from 'essentia-core'`), nunca por ruta relativa. Detalle en [`docs/agent/essentia.md`](docs/agent/essentia.md).
- **GPU-first:** todo efecto visual va en shader. El DOM es bridge de accesibilidad y eventos, nunca superficie de render.
- **Sin frameworks de UI ajenos en Essentia:** ni React, ni Vue, ni librerías de componentes. React vive solo en Telar y sus apps.
- **Paquetes sin build:** `essentia-*` distribuyen `src/` directamente (su `build` es un `echo`). Lo que exportás desde el barrel (`core.ts`, `styles.ts`, `ui.ts`) es la API pública.
- **Dependencias:** un solo lockfile en la raíz; nunca `--force` ni `--legacy-peer-deps`. Toda dependencia se resuelve desde el registry público de npm.
- **Deprecados:** `packages/ui-svelte-deprecated` y los directorios ignorados (`packages/ui-old`, `packages/ui-deprecated`, `packages/svelte-deprecated`) no se modifican ni se usan como referencia de estilo.

## Antes de tocar un área, leé su guía

| Si vas a tocar…                                                       | Leé                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| Cualquier código (nombres, imports, tipos, comentarios, tests)        | [`docs/agent/code.md`](docs/agent/code.md)               |
| `essentia-core`, `essentia-styles`, `essentia-ui`, shaders, demos     | [`docs/agent/essentia.md`](docs/agent/essentia.md)       |
| `@repo/telar`, `apps/telar`, `apps/docs`                              | [`docs/agent/telar.md`](docs/agent/telar.md)             |
| Ramas, commits, PRs, versiones o CHANGELOGs                           | [`docs/agent/git.md`](docs/agent/git.md)                 |
| `turbo.json`, dependencias, toolchain, configuración compartida      | [`docs/agent/environment.md`](docs/agent/environment.md) |
| Algo que no funciona como esperabas                                   | [`docs/agent/traps.md`](docs/agent/traps.md)             |

## Definition of Done

1. **Tests:** `npm run test --workspace=<nombre>` en cada paquete que tocaste. Si tocaste `essentia-core`, corré también los de `essentia-styles` y `essentia-ui`; si tocaste `essentia-styles`, también los de `essentia-ui`.
2. **Tipos:** `npm run check --workspace=<nombre>` en los paquetes Svelte que tocaste y en `web-svelte` si cambió una API que consume. No sumes errores nuevos a los preexistentes (ver [`traps.md`](docs/agent/traps.md)).
3. **Verificación visual:** si cambió algo que se ve (shader, primitiva, componente, demo), probalo en el navegador con `apps/web-svelte`. Una primitiva o componente nuevo suma su demo.
4. **CHANGELOG:** todo cambio en un paquete `essentia-*` suma su entrada en `[Unreleased]` del `CHANGELOG.md` del paquete (formato en [`git.md`](docs/agent/git.md)).
5. **Docs al día:**
   - cambió una regla → la guía de `docs/agent/` correspondiente;
   - cambió la API pública o el modelo de un paquete → su README y su `.claude/concept.md`;
   - cerró o avanzó una fase → el roadmap de [`packages/core/README.md`](packages/core/README.md).
