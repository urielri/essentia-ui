---
name: Essentia UI — Concept
description: Modelo mental y arquitectura del proyecto
---

# Concept

## ¿Qué es Essentia?

Un framework GPU-first para construir **aplicaciones** (no páginas, no juegos) con interfaces renderizadas íntegramente en la GPU. El DOM no es la superficie de renderizado — es una capa de soporte para accesibilidad y eventos nativos.

El stack es: **Svelte 5 → Threlte → Three.js → WebGPU / WebGL 2**

---

## La unidad mínima: EssentiaNode

La unidad atómica de UI no es un `div` ni un `Mesh` directo. Es un **`EssentiaNode`**: una abstracción propia que:

- Envuelve uno o más `Object3D` de Three.js
- Expone una API de alto nivel: bounds, anchoring, transform
- Gestiona su propio ciclo de vida dentro del scene graph
- Hereda transformaciones del padre de forma eficiente en GPU

Analogía: como un `VisualElement` de Unity UI Toolkit pero sobre Three.js, o como un "frame" de Figma pero en 3D.

---

## World Space Layout

No existe box model. No existe flujo de caja CSS.

El layout es un sistema de **transformaciones matriciales** con:

- **Cámara ortográfica 1:1** — 1 unidad de mundo = 1 píxel de pantalla
- **Anchoring system** — los nodos se anclan a su padre o al viewport
- **Responsive via viewport events** — el canvas reacciona a resize y recalcula transforms

---

## Estética: Liquid Glass PBR

Las formas no son geometría poligonal burda. Son:

- **SDF (Signed Distance Fields)** — rectángulos, círculos y bordes suaves calculados en shader, infinitamente precisos
- **Refracción dinámica** — pipeline multi-pasada que captura el framebuffer de fondo para calcular distorsión lumínica real con IOR
- **Materiales PBR** — normal maps, environment maps (IBL), roughness/metalness
- **Postprocesado** — blur (Kawase), chromatic aberration, depth of field cuando aplique

---

## Tipografía: MSDF

El texto es un objeto físico en el espacio 3D, no una capa HTML superpuesta.

- Generación de atlas: `msdf-atlas-gen`
- Renderizado: componente `Text` de `@threlte/extras`
- Resultado: glifos infinitamente nítidos a cualquier escala, con iluminación y refracción aplicables

---

## Accesibilidad: Hybrid Bridge

Para no romper SEO ni screen readers:

- **Shadow Layer** — DOM HTML invisible generado vía SSR/SSG, sincronizado en tiempo real con el estado del canvas
- **Ghost Inputs** — elementos `<input>` reales ocultos que gestionan foco, clipboard y teclados virtuales. La interactividad se proyecta al engine gráfico

---

## Stack tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| Reactividad | Svelte 5 (Runes) | Estado, ciclo de vida, componentes |
| Engine | Three.js ^0.180 | Core de renderizado |
| Abstracción | Threlte ^8 | Orquestación de componentes y lifecycle |
| Física / Input | @threlte/rapier | Raycasting para eventos + física |
| Shaders | GLSL / WGSL | SDF, PBR, refracción, postprocesado |
| Tipografía | msdf-atlas-gen + @threlte/extras Text | Texto vectorial en GPU |
| Shader bundling | vite-plugin-glsl | Importar .glsl como módulos con HMR |
| Tests | Vitest | Solo para core (store, graph, math) |

---

## Decisiones pendientes (TBD)

- **Relación componente Svelte ↔ mesh(es):** a definir con criterio de performance. Un componente puede orquestar múltiples meshes.
- **Escena vs Layout:** si el "layout" es la escena completa o si hay separación entre escena de fondo y escena de UI.
