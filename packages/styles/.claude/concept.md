---
name: Essentia Styles — Concept
description: Modelo mental de la capa de primitivas visuales
---

# Concept

`essentia-styles` provee las **primitivas visuales** del stack: cada
componente es un átomo de render GPU. No tienen jerarquía interna ni
contienen lógica de layout — solo dibujan.

## Primitivas

| Componente | Rol |
|---|---|
| `<Rect>` | Shape SDF con bordes redondeados |
| `<Image>` | Textura GPU con SDF rounded corners |
| `<Glass>` | Liquid glass: refracción + IBL + Fresnel |

## Reglas

- **Ortogonalidad**: ninguna primitiva acepta `children` de UI. Si querés
  componer (e.g. Glass + Text), declarás los componentes como hermanos en
  world space, o como hijos de un `<Box>` de `essentia-ui`.
- **Cada primitiva = mesh único**: cada componente renderiza UN mesh con
  un material custom. Sin sub-componentes ocultos.
- **Sin estado interno**: la fuente de verdad son los props. El shell
  reactivo (`.svelte`) sincroniza props → setters de un `Node` (`GlassNode`).
- **GPU-first**: shaders en `.glsl` separados, uniforms tipados, ciclo de
  vida de disposables vía `EssentiaNode.addDisposable()`.

## Composición

Mismo lenguaje que `essentia-core`: el `root` de cada primitiva es un
`Object3D` que se inserta en el scene graph. La jerarquía se delega a
`essentia-ui` (Flex/Box) o se hace explícita con `x`/`y`/`z` props.

## Dependencia con essentia-core

- `EssentiaNode` (clase base de los nodos visuales, ej: `GlassNode`).
- `useEngine()` (acceso a `viewport`, `envMap`, `backgroundTarget`).

`essentia-styles` NO importa de `essentia-ui` — el flujo de dependencias es:

```
essentia-ui  →  essentia-styles  →  essentia-core
```
