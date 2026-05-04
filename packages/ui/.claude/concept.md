---
name: Essentia UI — Concept
description: Modelo mental de la capa de componentes structurales y layout
---

# Concept

`essentia-ui` es la **capa estructural** del stack: componentes higher-level
que componen primitivas de `essentia-styles` dentro de jerarquías de
contenido y orquestan layout.

## Estado actual

Por ahora solo provee la **capa de layout** (re-exports de `@threlte/flex`
+ `Align`). Los componentes higher-level (Button, Card, Input) llegan en
fases siguientes.

## Layout: Flex/Box (Yoga)

La capa de layout es **opcional**. Coexiste con el sistema absoluto de
`essentia-core` (anchoring/setPosition):

- **Path A (absoluto)**: `<Glass x={..} y={..} {width} {height} />` — control
  fino, world space directo.
- **Path B (declarativo)**: `<Flex><Box flex={1}><Glass /></Box></Flex>` —
  layout reactivo, responde a resize y reflow.

Yoga compone constraints → outputs `(x, y, w, h)` por nodo. NO es box model
CSS — es un solver de constraints. La regla "no DOM como superficie de
render" no se viola.

## Higher-level components (futuro)

Cuando se agreguen Button/Card/Input, seguirán este patrón:

- **Composición**: combinan primitivas de `essentia-styles` (Glass + Text,
  Image + Rect, etc.) más layout (`<Box>`).
- **Sin estado oculto**: la fuente de verdad sigue siendo los props.
- **Dependencias**: pueden depender de `essentia-styles` y `essentia-core`.

## Filosofía

`essentia-ui` mantiene **separación entre estructura y estilo**:

```
ui (estructura)     →    Button, Card, Input, Flex, Box
                              │
                              ▼
styles (estilo)     →    Glass, Rect, Image, Text
                              │
                              ▼
core (runtime)      →    EssentiaRoot, EssentiaNode, useEngine
```

Cada capa solo conoce las que están debajo. Si un consumidor solo necesita
runtime, usa `essentia-core`. Si quiere primitivas visuales sin layout,
usa `essentia-core + essentia-styles`. Layer composable.
