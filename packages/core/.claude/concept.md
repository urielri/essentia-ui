---
name: Essentia Core — Concept
description: Modelo mental del runtime / engine. Capa más baja del stack 3-layer.
---

# Concept

`essentia-core` es la **capa runtime** del stack Essentia. Provee el engine,
el scene graph, el viewport, la cámara y la abstracción base `EssentiaNode`.
NO contiene primitivas visuales (shaders/materiales) — eso vive en
`essentia-styles`. NO contiene componentes structurales (Flex/Box/Button) —
eso vive en `essentia-ui`.

## Stack 3-layer

```
essentia-ui      → Componentes structurales y layout (Flex/Box/Align,
                   futuros Button/Card/Input)
                       │ depende de
                       ▼
essentia-styles  → Primitivas visuales GPU (Glass/Rect/Image/Text + Nodes)
                       │ depende de
                       ▼
essentia-core    → Runtime: engine, scene graph, viewport, EssentiaNode
```

Dependencia unidireccional: las capas superiores conocen las inferiores,
nunca al revés.

## ¿Qué es Essentia (a nivel proyecto)?

Un framework GPU-first para construir **aplicaciones** (no páginas, no
juegos) con interfaces renderizadas íntegramente en la GPU. El DOM no es
la superficie de renderizado — es una capa de soporte para accesibilidad
y eventos nativos.

Stack tecnológico: **Svelte 5 → Threlte → Three.js → WebGL 2 / WebGPU**.

## La unidad mínima: EssentiaNode

La unidad atómica de UI no es un `div` ni un `Mesh` directo. Es un
**`EssentiaNode`**: una clase que vive en `essentia-core` y:

- Envuelve uno o más `Object3D` de Three.js (`root`)
- Expone API de alto nivel: `bounds`, `anchor`, `setSize`, `setPosition`,
  `setScale`, scene graph (`addChild`/`removeChild`/`destroy`)
- Gestiona ciclo de vida de recursos GPU vía `addDisposable()`
- Hereda transformaciones del padre eficientemente en GPU

Subclases concretas (e.g. `GlassNode`, futuro `TextNode`) viven en
`essentia-styles` junto a sus shaders. `essentia-core` solo provee la
clase base.

Analogía: como un `VisualElement` de Unity UI Toolkit pero sobre Three.js,
o como un "frame" de Figma pero en 3D.

## World Space Layout

No existe box model. No existe flujo de caja CSS.

El layout absoluto que provee core es un sistema de **transformaciones
matriciales** con:

- **Cámara ortográfica 1:1** — 1 unidad de mundo = 1 píxel de pantalla
- **Anchoring system** — los nodos se anclan a su padre o al viewport
- **Responsive via viewport events** — el canvas reacciona a resize y
  recalcula transforms

Una capa de layout declarativa opcional (Yoga via `@threlte/flex`) vive
en `essentia-ui` y coexiste con este sistema absoluto.

## Componente raíz: EssentiaRoot

`<EssentiaRoot>` monta la escena Threlte y orquesta:

- `<Canvas>` con la cámara ortográfica 1:1
- `<SceneBackground>` que captura `BackgroundCapture` para refracción Glass
- `<BackgroundCapture>` (render target del fondo, sin Glass)
- `<Interactivity>` (plugin de raycasting para eventos pointer)
- `<Environment>` (HDR/EXR loader opcional)
- `<Suspense>` (orquestación de carga asíncrona, opt-in vía `loading` snippet)

El `Engine` context (`useEngine()`) expone estado central reactivo:
viewport, camera, envMap, backgroundTarget, glassMeshes registrados.

## Accesibilidad: Hybrid Bridge (futuro, Fase 5)

Para no romper SEO ni screen readers:

- **Shadow Layer** — DOM HTML invisible generado vía SSR/SSG, sincronizado
  en tiempo real con el estado del canvas
- **Ghost Inputs** — elementos `<input>` reales ocultos que gestionan
  foco, clipboard y teclados virtuales. La interactividad se proyecta al
  engine gráfico

`essentia-core` proveerá las utilidades (`worldToScreen` ya existe;
`projectNode` y similares vendrán en Fase 5). Los componentes Input
viven en `essentia-ui`.

## Stack tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| Reactividad | Svelte 5 (Runes) | Estado, ciclo de vida, componentes |
| Engine | Three.js ^0.180 | Core de renderizado |
| Abstracción | Threlte ^8 | Orquestación Threlte y lifecycle |
| Eventos | @threlte/extras `interactivity` | Raycasting para pointer events |
| Tests | Vitest | Tests de math, camera y EssentiaNode |

## Decisiones pendientes (TBD)

- **Ghost Inputs / projectNode utility**: API exacta para proyectar bounds
  de un EssentiaNode a coords de pantalla via `worldToScreen` + matrix
  world. Necesario antes de Fase 5.
- **Performance budget**: definir cuándo activar instancing (`InstancedMesh`)
  para listas grandes de primitivas.
