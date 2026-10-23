# Trampas conocidas

Detalles no obvios que ya costaron tiempo. Sumá uno solo cuando lo descubras de verdad, con la fecha si depende de algo externo, y borralo cuando deje de aplicar.

## Render y primitivas

- **Un cambio de prop no se ve en el canvas.** Threlte renderiza on-demand: el `$effect` del shell tiene que terminar con `invalidate()`. Si el nodo hace trabajo asíncrono (texturas, `sync()` de troika), el `invalidate()` inmediato renderiza el estado anterior: hay que invalidar otra vez cuando termina (ver `TextNode.onSync` en `text.svelte`).
- **El texto sobre un Glass se ve refractado o duplicado (al 23/10/2026).** `BackgroundCapture` oculta solo los meshes registrados en `engine.glassMeshes`, así que las primitivas con `z` mayor que el Glass entran en la captura del fondo y se refractan. No está resuelto.
- **Handlers de pointer que no disparan.** `<T is={node.root} onclick={…}>` no siempre registra los handlers en el plugin de interactividad. Envolvé `node.root` en un `<T.Group>` con los handlers, como `glass.svelte`.

## Demos (`apps/web-svelte`)

- **La landing `/` responde 500 en un clone limpio (al 23/10/2026).** Carga environment maps `.hdr` que están en `.gitignore`. Conseguí los archivos o probá en otra ruta (`/text-demo`, `/components-demo`).
- **`svelte-check` de `web-svelte` ya tiene errores (al 23/10/2026).** Son 17 preexistentes: tipos dentro de `node_modules`, la declaración de módulos `.glsl` y la opción `compress` de `vite.config.ts`. Lo que importa es no sumar errores nuevos en los archivos que tocaste.

## Toolchain y monorepo

- **`npx turbo run test` o `check` no funciona.** `turbo.json` solo declara `build`, `dev`, `dev:svelte` y `build:ui-svelte`. Corré los tests y `svelte-check` por workspace con `npm run <script> --workspace=<nombre>`. Por lo mismo, `npm run publish-packages` (que pide `lint` y `test` a turbo) no está en condiciones de correr.
- **`dev:svelte` compila el paquete deprecado.** En `turbo.json`, `dev:svelte` depende de `@repo/ui-svelte#build:ui-svelte` (`packages/ui-svelte-deprecated`). Es un `echo`, así que no rompe, pero no es una dependencia real.
- **`@repo/ui` apunta a un directorio ignorado.** `apps/telar` declara `@repo/ui` como devDependency y lo transpila en `next.config.mjs`, pero en el lockfile `@repo/ui` resuelve a `packages/ui-deprecated`, que está en `.gitignore`. No confundas `@repo/ui` con `essentia-ui` (`packages/ui`). Ningún archivo de `apps/telar` lo importa hoy.
- **Una dependencia resuelve desde un registry privado.** Pasó con `troika-three-text` en `package-lock.json`. Antes de commitear el lockfile, buscá URLs `resolved` que no sean de `registry.npmjs.org`.
- **READMEs heredados.** Los de `apps/web-svelte`, `apps/docs` y `apps/telar` son plantillas de `sv` / `create-next-app` y mencionan pnpm, yarn o bun. El repo usa solo npm.

## Convenciones con contradicciones heredadas

- **Nombres de uniforms.** La guía anterior (`packages/core/.claude/rules.md`) pedía camelCase con prefijo `u_` (`u_chromaticAberration`), pero todos los shaders usan snake_case (`u_chromatic_aberration`). La regla vigente es snake_case (ver [`essentia.md`](./essentia.md#shaders-essentia-stylessrcshaders)).
- **`$effect` y `useTask`.** La guía anterior pedía sincronizar uniforms dentro de `useTask`. Los shells sincronizan en `$effect` + `invalidate()`; `useTask` queda para trabajo por frame.
- **Formato.** `@repo/prettier-config` pide punto y coma y comillas dobles; el código usa lo contrario y nadie corre Prettier (ver [`code.md`](./code.md#formato)).
