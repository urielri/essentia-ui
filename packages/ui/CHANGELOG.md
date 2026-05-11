# CHANGELOG — essentia-ui

Documento informativo. Versionado vía Changesets + Turborepo.

`essentia-ui` es la **capa estructural** del stack: re-exports de layout
(`Flex`, `Box`, `Align`) más componentes higher-level que componen primitivas
de `essentia-styles` (Glass, Text, Rect, Image). Sin estado oculto — la
fuente de verdad sigue siendo los props.

## [0.1.0] — Higher-level components (Fase 5A)

Primer release con componentes propios. La layer pasa de ser solo un
re-export de layout (`@threlte/flex`) a exponer composiciones reales sobre
las primitivas de `essentia-styles`.

### Added

- **`<GlassButton>`** componente: panel `<Glass>` con `cursor='pointer'`
  + `<Text>` centrado sobre él. Props: `label`, `width`, `height`,
  `radius`, `fontSize`, `variant`, `disabled`, `x`/`y`/`z`, `onclick`.
  Variantes: `'primary' | 'secondary' | 'ghost'`. Estado deshabilitado
  apaga el handler de click y oscurece tinte + color del texto.
- **`<Card>`** componente: contenedor de superficie. Renderiza un
  `<Glass>` de fondo (con `blur` por default = 4) y expone un snippet
  `children` para que el consumidor coloque primitivas como hermanos en
  world space. NO hace layout interno — para layouts ricos se usa
  `<Flex>/<Box>` adentro del snippet.
- **`buildGlassButtonState()`** (`components/glass-button.config.ts`):
  función pura exportada. Resuelve `variant + disabled` en el conjunto
  de props finales para `<Glass>` y `<Text>`. Permite tests sin renderer.
- **Tests**: `glass-button.config.test.ts` (16 tests) cubre defaults,
  variantes, disabled, combinaciones y aislamiento del estado.
- **Demo route**: `/components-demo/` en `apps/web-svelte` — playground
  con las tres variantes apiladas, contador de clicks por variante, Card
  con texto + botón anidado y toggle de disabled.

### Dependencies

- Agregados a `dependencies`: `essentia-core`, `essentia-styles`,
  `@threlte/core`.
- Agregado a `devDependencies`: `vitest`.

### Patterns

- **Tests sin renderer**: la lógica de variants vive en una función pura
  (`buildGlassButtonState`). El componente Svelte queda como adaptador
  trivial. Esto evita la complejidad de montar Threlte en jsdom.
- **Composición horizontal**: los higher-level components no anidan
  hijos dentro del scene graph — declaran primitivas como hermanos
  posicionados via `x`/`y`/`z`. `<Card>` lo formaliza con un snippet.

## [Pre-0.1.0] — Layout-only baseline

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
