# CHANGELOG — essentia-ui

Documento informativo. Versionado vía Changesets + Turborepo.

`essentia-ui` es la capa de **componentes structurales y layout**. Por ahora
solo provee la capa de layout (Flex/Box/Align). Cuando se agreguen
higher-level components (Button, Card, Input), se documentarán acá.

## [Unreleased]

### Added

- **Re-exports de `@threlte/flex`**: `Flex`, `Box`, `useReflow`,
  `useDimensions`, `tailwindParser`, `createClassParser`, tipo
  `FlexNodeProps`. Capa opcional de orquestación declarativa de layouts.
  Coexiste con el sistema absoluto de `essentia-core`
  (anchoring/setPosition).
- **Re-export de `Align`** desde `@threlte/extras`: complemento natural de
  Flex para posicionar el centro de un subtree en `(x, y, z)`.

## [0.0.0] — Initial empty package

Creado durante el split de `essentia` en tres paquetes ortogonales. Sin
componentes propios todavía. Las primeras adiciones serán componentes
structurales que componen primitivas de `essentia-styles` (e.g.
`<GlassButton>`, `<Card>`).
