# CHANGELOG — Essentia UI

Documento informativo. La gestión de versiones y publicación está delegada a
[Changesets](https://github.com/changesets/changesets) + Turborepo (ver
`/.changeset/config.json`). Este archivo agrega contexto humano sobre los
hitos del paquete.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

Trabajo posterior a `0.1.0` (Fase 3). Incluye preparación de Fase 4
(raycasting events ya completo, MSDF Text pendiente) más infraestructura
adicional (Suspense, Flex layout, Environment).

### Added

- **`GlassNode extends EssentiaNode`** (`lib/nodes/glass-node.ts`): nodo que
  encapsula `Mesh` + `ShaderMaterial` + `PlaneGeometry` + uniforms. Setters
  tipados (`setIor`, `setBlur`, `setTint`, `setResolution`, etc.). Override
  de `setSize` que sincroniza bounds/escala/uniform `u_size`. Geometry y
  material registrados como disposables para liberación automática.
- **`EssentiaNode.addDisposable()`** + interface `Disposable`. `destroy()`
  ahora libera recursos GPU registrados antes de propagar a hijos.
- **`<Image>`** componente: textura GPU con SDF rounded corners. Migrado a
  `useLoader(TextureLoader)` + `useSuspense` — cache compartido por URL,
  `colorSpace` correcto, participación en `<Suspense>`.
- **`<EssentiaRoot environment={...}>`**: integración con `<Environment/>` de
  `@threlte/extras`. Carga automática de HDR/EXR/img como env map.
  `EnvironmentOptions` re-exportado para tipado.
- **`<EssentiaRoot loading={snippet}>`**: orquestación opt-in de `<Suspense>`.
  Si se provee, los `children` se envuelven en Suspense con el snippet como
  fallback durante la carga de recursos asíncronos.
- **`<EssentiaRoot background={...}>`**: prop para color de fondo de la escena.
  Aplicado vía `<SceneBackground>` para que `BackgroundCapture` lo capture
  y los Glass refracten correctamente.
- **`<Interactivity>`** wrapper (`lib/core/interactivity.svelte`): activa el
  plugin de raycasting de `@threlte/extras` y propaga el contexto a sus
  descendientes Svelte. Montado por `EssentiaRoot` como wrapper de los
  children.
- **Glass interactivity**: props `onclick`, `onpointerenter`, `onpointerleave`,
  `onpointermove`, `onpointerdown`, `onpointerup` tipados via
  `InteractivityProps`. Más prop `cursor?: string` que activa el bridge DOM
  vía `useCursor` para cambiar `document.body.style.cursor` en hover.
- **Glass uniforms expuestos**: `blur` (kernel Gaussiano 3×3 sobre el RT de
  fondo), `fresnelStrength` (antes hardcodeado en `0.06`), `envIntensity`
  (gating del aporte IBL del env map).
- **`<GlassPlayground>`**: componente self-contained con sliders para todos
  los props de Glass. Útil como demo y para tunear visualmente.
- **Re-exports de `@threlte/flex`** desde `essentia/ui`: `Flex`, `Box`,
  `useReflow`, `useDimensions`, `tailwindParser`, `createClassParser`,
  tipo `FlexNodeProps`. Capa opcional de orquestación declarativa de
  layouts. Coexiste con el sistema absoluto (anchoring/setPosition).
- **Re-export de `Align`** desde `@threlte/extras`: complemento de Flex para
  posicionar el centro de un subtree en `(x, y, z)`.
- **`useEngine()` + `Engine` context**: estado central de la escena
  (`viewport`, `tick`, `camera`, `envMap`, `backgroundTarget`, `glassMeshes`).
  Disponible desde cualquier componente descendiente de `<EssentiaRoot>`.
- **Tests**: `essentia-node.test.ts` extendido con cobertura de disposables.
  Nuevo `glass-node.test.ts` (23 tests) cubriendo construcción, `setSize`,
  setters, `setResolution`, disposal vía spies. Total: 73 tests.
- **`glsl.d.ts`** ambient declaration para imports `.glsl`/`.vert`/`.frag`
  como string (resuelve los errores de tipos en toda la librería).
- **Nuevas rutas demo** en `apps/web-svelte`: `/product`, `/playground`,
  `/flex-demo`.

### Changed

- **`<Glass>`** refactorizado a shell reactivo sobre `GlassNode`. Props
  públicos sin cambios (backwards compatible). Lógica GPU (geometry,
  material, uniforms) movida al nodo. Render envuelto en `<T.Group>` que
  actúa como host de los handlers de interactividad (el patrón
  `<T is={existing_obj}>` no propagaba eventos correctamente).
- **`<EssentiaRoot>`**: árbol interno de Canvas reordenado. `Environment`,
  `Suspense` y `children` ahora se renderizan dentro de `<Interactivity>`
  para que el plugin de raycasting esté visible en su scope Svelte.

### Fixed

- **DPR bug crítico** en Glass: `u_resolution` ahora se pasa en píxeles
  físicos (`viewport.width × dpr`). Antes, con DPR ≥ 2, el sampling del
  `backgroundTarget` quedaba fuera de `[0,1]` → Glass renderizaba negro.
- **Dirección de refracción**: invertida a `+toCenter` (lente divergente)
  en lugar de `-toCenter` (convergente, invertía la imagen).
- **AA en SDF**: implementado con `fwidth(d) + softness`, automáticamente
  DPR-aware. Default `softness = 0` para bordes nítidos sin manualidad.
- **Recursión infinita en `BackgroundCapture`**: corregida vía toggle de
  `m.visible` durante la captura del frame de fondo.
- **`<Image>` cleanup**: removido el `uniforms.u_texture.value?.dispose()`
  del cleanup. La textura es propiedad del cache compartido de `useLoader`;
  disponer ahí rompía otros `<Image>` con el mismo `src`.

## [0.1.0] — Fase 3: Liquid Glass + Environment Map

Primera versión publicable. Hito completado con commits:

- `5c522fb feat(glass): EXR environment map support (IBL) + demo switch`
- `9d2a02a feat(essentia): Fase 3 — Liquid Glass con refracción screen-space`

### Added

- **`<Glass>`** componente: panel de cristal líquido con SDF rounded corners,
  refracción screen-space, aberración cromática, tinte y soporte de env map
  (IBL).
- **Pipeline de captura**: `BackgroundCapture` renderiza la escena (sin los
  Glass) a un `WebGLRenderTarget` que el shader Glass usa como `u_background`
  para calcular la refracción.
- **Soporte EXR/HDR** equirectangular como `envMap` (prop de `EssentiaRoot`).
  Sampleado por el shader Glass via `u_env_map` para reflejos del entorno.

## [Pre-0.1.0] — Hitos previos

### Fase 2 — SDF Rect

Commit `83bc40c feat(essentia): Fase 2 — SDF Rect + demo visual en web-svelte`.

- **`<Rect>`** componente: shape SDF con bordes redondeados (uniforms
  `u_size`, `u_radius`, `u_color`, `u_opacity`, `u_softness`). Geometry
  reutilizable: `PlaneGeometry(1, 1)` escalada vía `mesh.scale`.
- **Shaders**: `sdf-rect.vert.glsl`, `sdf-rect.frag.glsl`. Uniforms tipados
  en `sdf-rect.uniforms.ts`.
- **Demo visual** en `apps/web-svelte` con grid de Rects coloreados.

### Fase 1 — Orchestrator + cámara ortográfica

Commit `9a845f0 feat(essentia): inicializar packages/ui como Essentia UI (Fase 1)`.

- **`<EssentiaRoot>`** componente raíz: monta `<Canvas>` de Threlte y la
  cámara ortográfica 1:1 con `useTask`.
- **`<OrthoCamera>`**: cámara ortográfica con mapping 1 unidad de mundo =
  1 píxel CSS. Origen al centro del viewport. Reactivo a resize.
- **`EssentiaNode`** clase base: `Object3D` + bounds + anchoring + scene
  graph (`addChild`/`removeChild`/`destroy`). Sin lógica GPU.
- **Utilidades de cámara**: `worldToScreen`, `screenToWorld`,
  `updateCameraFrustum`, `createOrthographicCamera`.
- **Tests** iniciales para `EssentiaNode` (jerarquía, transform, destroy)
  y utilidades de cámara.
