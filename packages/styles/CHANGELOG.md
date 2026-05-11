# CHANGELOG — essentia-styles

Documento informativo. Versionado vía Changesets + Turborepo.

`essentia-styles` es la capa de **primitivas visuales**: shape SDF (`<Rect>`),
texturas (`<Image>`), efectos GPU (`<Glass>`), texto MSDF (`<Text>`), y los
nodos asociados (`GlassNode`, `TextNode`). Todas las primitivas son hermanos
en composición — ninguna acepta children de UI; la jerarquía la maneja la
layer `essentia-ui`.

## [0.2.0] — Fase 4: MSDF Text

### Added

- **`<Text>`** componente: texto MSDF vía troika-three-text. Props
  `text`, `fontSize`, `color`, `font` (URL custom), `alignment`,
  `anchorX`/`anchorY` (normalizados [0..1]), `maxWidth` (wrap), `lineHeight`,
  `letterSpacing`, `x`/`y`/`z`. Shell reactivo que sincroniza props
  → setters del nodo.
- **`TextNode extends EssentiaNode`** (`nodes/text-node.ts`): nodo que
  encapsula `Text` mesh de troika. Setters tipados chainables
  (`setText`, `setFontSize`, `setColor`, `setFont`, `setAlignment`,
  `setAnchorX`, `setAnchorY`, `setMaxWidth`, `setLineHeight`,
  `setLetterSpacing`). El mesh de troika se registra como disposable para
  liberar atlas + material en `destroy()`.
- **Glass shader refinement** (Step 3 — Fase 3.5):
  - Nuevo uniform `u_surface_roughness` [0..1] que perturba el normal
    virtual con ruido procedural 2D. Default `0` mantiene el comportamiento
    actual; opt-in vía prop `surfaceRoughness` en `<Glass>`.
  - IBL convertido de aditivo a mezcla vía Fresnel-Schlick (F0 = 0.04):
    centro deja pasar refracción pura, bordes muestran reflejo dominante.
  - Función `noise2D()` procedural añadida al shader.
- **Exports**: `Text`, `TextNode`, `TextNodeOptions`, `TextAlignment`,
  `AnchorNormalized` agregados a `styles.ts`.
- **Tests**: `text-node.test.ts` (20 tests) cubre construcción, defaults,
  setters, traducción de anchors, chainability y cleanup. `glass-node.test.ts`
  extendido con test para `setSurfaceRoughness`.
- **Demo route**: `/text-demo/` en `apps/web-svelte` — playground
  interactivo con hero/body/caption text y opción de Glass de fondo.

### Dependencies

- Agregado: `troika-three-text@^0.52.4`
- Agregado (dev): `jsdom` (para tests que requieren globales de browser).

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
