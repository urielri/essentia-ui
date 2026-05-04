# CHANGELOG — essentia-core

Documento informativo. La gestión de versiones y publicación está delegada a
[Changesets](https://github.com/changesets/changesets) + Turborepo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y [Semantic Versioning](https://semver.org/lang/es/).

`essentia-core` es la capa runtime: engine, scene graph, viewport, cámara y
abstracciones base (`EssentiaNode`). NO contiene primitivas visuales ni
componentes structurales.

## [Unreleased]

Trabajo posterior a `0.1.0`. La pieza central es la separación del paquete
único `essentia` en tres paquetes ortogonales (`essentia-core`,
`essentia-styles`, `essentia-ui`).

### Added

- **`EssentiaNode.addDisposable()`** + interface `Disposable`. `destroy()`
  ahora libera recursos GPU registrados antes de propagar a hijos.
- **`<EssentiaRoot environment={...}>`**: integración con `<Environment/>` de
  `@threlte/extras`. Carga automática de HDR/EXR/img como env map. Tipo
  `EnvironmentOptions` exportado.
- **`<EssentiaRoot loading={snippet}>`**: orquestación opt-in de `<Suspense>`.
  Si se provee, los `children` se envuelven en Suspense con el snippet como
  fallback durante la carga de recursos asíncronos.
- **`<EssentiaRoot background={...}>`**: prop para color de fondo de la
  escena. Aplicado vía `<SceneBackground>` para que `BackgroundCapture` lo
  capture y los Glass refracten correctamente.
- **`<Interactivity>`** wrapper interno (`lib/core/interactivity.svelte`):
  activa el plugin de raycasting de `@threlte/extras` y propaga el contexto
  a sus descendientes Svelte. Montado por `EssentiaRoot` como wrapper de los
  children.
- **`useEngine()` + `Engine` context**: estado central de la escena
  (`viewport`, `tick`, `camera`, `envMap`, `backgroundTarget`, `glassMeshes`).

### Changed

- **Renombrado**: paquete `essentia` → `essentia-core`. Export root `'.'`
  reemplaza al subpath `'./ui'`. Consumidores deben importar `'essentia-core'`.
- **`<EssentiaRoot>`**: árbol interno de Canvas reordenado. `Environment`,
  `Suspense` y `children` ahora se renderizan dentro de `<Interactivity>`
  para que el plugin de raycasting esté visible en su scope Svelte.
- **Scope reducido**: el paquete pasó de exportar primitivas visuales
  (`Glass`/`Rect`/`Image`/`GlassNode`) a solo runtime. Las primitivas se
  movieron a `essentia-styles`.

### Fixed

- **Recursión infinita en `BackgroundCapture`**: corregida vía toggle de
  `m.visible` durante la captura del frame de fondo.

## [0.1.0] — Fase 3: Liquid Glass + Environment Map

Primera versión publicable como `essentia` (predecesor de `essentia-core`).
Hito completado con commits:

- `5c522fb feat(glass): EXR environment map support (IBL) + demo switch`
- `9d2a02a feat(essentia): Fase 3 — Liquid Glass con refracción screen-space`

### Added

- **Pipeline de captura**: `BackgroundCapture` renderiza la escena (sin los
  Glass) a un `WebGLRenderTarget` que el shader Glass usa para refracción.
- **Soporte EXR/HDR** equirectangular como `envMap` (prop de `EssentiaRoot`).

## [Pre-0.1.0] — Hitos previos

### Fase 1 — Orchestrator + cámara ortográfica

Commit `9a845f0 feat(essentia): inicializar packages/ui como Essentia UI (Fase 1)`.

- **`<EssentiaRoot>`** componente raíz: monta `<Canvas>` de Threlte y la
  cámara ortográfica 1:1.
- **`<OrthoCamera>`**: cámara ortográfica con mapping 1 unidad de mundo =
  1 píxel CSS. Origen al centro del viewport. Reactivo a resize.
- **`EssentiaNode`** clase base: `Object3D` + bounds + anchoring + scene
  graph (`addChild`/`removeChild`/`destroy`). Sin lógica GPU.
- **Utilidades de cámara**: `worldToScreen`, `screenToWorld`,
  `updateCameraFrustum`, `createOrthographicCamera`.
- **Tests** iniciales para `EssentiaNode` y utilidades de cámara.
