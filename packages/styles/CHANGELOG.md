# CHANGELOG — essentia-styles

Documento informativo. Versionado vía Changesets + Turborepo.

`essentia-styles` es la capa de **primitivas visuales**: shape SDF (`<Rect>`),
texturas (`<Image>`), efectos GPU (`<Glass>`), y los nodos asociados
(`GlassNode`). Todas las primitivas son hermanos en composición — ninguna
acepta children de UI; la jerarquía la maneja la layer `essentia-ui`.

## [0.1.0] — Initial release

Inicializado como split de `essentia` (predecesor `essentia-core@0.1.0`).
Hereda toda la implementación de Fase 2 (SDF Rect) y Fase 3 (Liquid Glass).

### Added

- **`<Rect>`** componente: shape SDF con bordes redondeados (uniforms
  `u_size`, `u_radius`, `u_color`, `u_opacity`, `u_softness`).
- **`<Image>`** componente: textura GPU con SDF rounded corners. Usa
  `useLoader(TextureLoader)` + `useSuspense` — cache compartido por URL,
  `colorSpace` correcto, participación en `<Suspense>`.
- **`<Glass>`** componente: panel de cristal líquido con refracción
  screen-space, SDF rounded corners, blur opcional, IBL y aberración
  cromática. Shell reactivo sobre `GlassNode`. Render envuelto en
  `<T.Group>` que actúa como host de los handlers de interactividad.
- **Glass props**: `blur` (kernel Gaussiano 3×3 sobre el RT de fondo),
  `fresnelStrength` (antes hardcodeado), `envIntensity` (gating del aporte
  IBL del env map), `cursor` (bridge DOM via `useCursor`), props de
  interactividad (`onclick`, `onpointerenter`, etc.) tipados via
  `InteractivityProps`.
- **`GlassNode extends EssentiaNode`** (`nodes/glass-node.ts`): nodo que
  encapsula `Mesh` + `ShaderMaterial` + `PlaneGeometry` + uniforms. Setters
  tipados (`setIor`, `setBlur`, `setTint`, `setResolution`, etc.). Override
  de `setSize` que sincroniza bounds/escala/uniform `u_size`. Geometry y
  material registrados como disposables para liberación automática.
- **Shaders**: `glass.{vert,frag}.glsl` + `sdf-rect.{vert,frag}.glsl` +
  `image.frag.glsl`. Uniforms tipados en `*.uniforms.ts`.
- **Tests**: `glass-node.test.ts` (23 tests) cubre construcción, `setSize`,
  setters, `setResolution`, disposal vía spies.

### Fixed

- **DPR bug crítico** en Glass: `u_resolution` se pasa en píxeles físicos
  (`viewport.width × dpr`). Antes con DPR ≥ 2 el sampling del
  `backgroundTarget` quedaba fuera de `[0,1]` → Glass renderizaba negro.
- **Dirección de refracción**: invertida a `+toCenter` (lente divergente)
  en lugar de `-toCenter` (convergente, invertía la imagen).
- **AA en SDF**: implementado con `fwidth(d) + softness`, automáticamente
  DPR-aware. Default `softness = 0` para bordes nítidos.
- **`<Image>` cleanup**: removido `uniforms.u_texture.value?.dispose()`. La
  textura es propiedad del cache de `useLoader`; disponer ahí rompía otros
  `<Image>` con el mismo `src`.

## [Pre-0.1.0] — Hitos previos al split

### Fase 2 — SDF Rect

Commit `83bc40c feat(essentia): Fase 2 — SDF Rect + demo visual en web-svelte`.

- `<Rect>` componente. Geometry reutilizable (`PlaneGeometry(1, 1)` escalada
  vía `mesh.scale`).
- Demo visual con grid de Rects coloreados.

### Fase 3 — Liquid Glass + Environment Map

Commits `9d2a02a` y `5c522fb`. Implementación inicial de `<Glass>` con
refracción screen-space, soporte HDR/EXR vía env map.
