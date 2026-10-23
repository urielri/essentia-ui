# Entorno, dependencias y configuración compartida

Leé esta guía antes de tocar `turbo.json`, el `package.json` raíz, dependencias, la versión de Node o los paquetes de configuración (`packages/*-config`).

## Toolchain

- **Node:** `.nvmrc` pide 25 y `engines` acepta `>=24`. Usá `nvm use` en la raíz.
- **npm** (`packageManager: npm@11`). El repo migró de pnpm a npm: no uses pnpm, yarn ni bun aunque algún README heredado los mencione.
- **Cambiar de versión** de Node o de npm es configuración compartida: preguntá antes y actualizá `.nvmrc`, `engines` y `packageManager` juntos.

## Dependencias

- **Lockfile:** uno solo, `package-lock.json` en la raíz.
- **Agregar una dependencia:** `npm install <paquete>@<versión> --workspace=<nombre>`. Una dependencia nueva es decisión del usuario (ver `CLAUDE.md`).
- **Registry público:** toda entrada del lockfile resuelve desde `registry.npmjs.org`. Si aparece una URL de un registry privado, corregila antes de commitear (ya pasó con `troika-three-text`).
- **Nunca uses `--force` ni `--legacy-peer-deps`** para tapar un conflicto de peers: resolvelo o dejá la versión anterior y anotalo en [`traps.md`](./traps.md).
- **Versiones compatibles entre paquetes Essentia:** `three`, `@types/three`, `@threlte/*`, `svelte`, `vite` y `vitest` se declaran en `core`, `styles`, `ui` y `web-svelte` con la misma versión mayor. Si actualizás una, actualizala en todos para que el lockfile no resuelva dos copias (dos `three` rompen `instanceof` y el scene graph).
- **Dependencias internas** con `"*"` (`"essentia-core": "*"`): se resuelven por npm workspaces.

## Paquetes Essentia: source distribution

- **Exportan `src/` directamente** (`exports` apunta a `./src/<barrel>.ts`) y su script `build` es un `echo`. El consumidor (Vite / SvelteKit) compila.
- **No agregues un paso de build ni `dist/`** a estos paquetes sin una decisión: cambia cómo los resuelve `web-svelte`.
- **Configuración por paquete:** cada uno tiene su `tsconfig.json` (extiende `@tsconfig/svelte`, `moduleResolution: bundler`, `verbatimModuleSyntax`) y su `vite.config.ts` con la config de Vitest. `essentia-styles` suma `vite-plugin-glsl` para importar shaders.

## Turborepo (`turbo.json`)

- **Tareas declaradas:** `build` (depende de `^build`), `dev`, `dev:svelte` y `build:ui-svelte`.
- **`test` y `check` no están declaradas:** corrélas por workspace con npm (`npm run test --workspace=<nombre>`). Declararlas en `turbo.json` es configuración compartida: preguntá antes.
- **`dev:svelte` depende de `@repo/ui-svelte#build:ui-svelte`,** el paquete deprecado. No lo saques de pasada: es un cambio de configuración.

## Scripts de la raíz

- `npm run task <tarea> [paquete]` → `run-task.sh`: corre `turbo <tarea>` o `turbo <tarea>:<paquete>`.
- `npm run clean-nm` → `clean-node_modules.sh`: **borra todos los `node_modules` y el `package-lock.json`**. No lo corras sin que el usuario lo pida.
- `npm run publish-packages`: lint, tests, build, `changeset version` y `changeset publish`. **Publica a npm:** nunca sin pedido explícito (los paquetes todavía no se publican).

## Configuración compartida

- `packages/typescript-config`: `base.json`, `nextjs.json`, `react-library.json`. Los paquetes Essentia no la extienden en la práctica (usan `@tsconfig/svelte`).
- `packages/eslint-config`: la usan las apps Next. Los paquetes Essentia no tienen lint.
- `packages/prettier-config`: no está conectada y no refleja el estilo actual (ver [`code.md`](./code.md#formato)).
- `packages/vite-config`: config de Vitest con React para Telar.

Cualquier cambio en estos paquetes, en `turbo.json`, en el `package.json` raíz o en `.changeset/` se propone antes (ver `CLAUDE.md`).

## Assets pesados

- **`.hdr` y `.exr` están en `.gitignore`** (environment maps para IBL). Viven solo en la máquina de cada uno.
- **`references/` y `results/`** también se ignoran: material de referencia y reportes de tests.
- **Imágenes de demos** en `apps/web-svelte/static/`. Comprimilas al tamaño de uso antes de commitear.
