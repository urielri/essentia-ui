# essentia-core

Capa **runtime** del stack Essentia. Provee el engine, el scene graph, el
viewport, la cámara ortográfica 1:1 y la abstracción base `EssentiaNode`.

Todo el resto del stack se construye encima:

```
essentia-ui      → Componentes structurales y layout
                       │ depende de
                       ▼
essentia-styles  → Primitivas visuales GPU (Glass, Rect, Image, Text)
                       │ depende de
                       ▼
essentia-core    ← (vos estás acá) Runtime
```

## Esto NO es

- Una librería de componentes visuales (Glass/Rect/Image viven en
  [`essentia-styles`](../styles)).
- Una librería de componentes structurales (Flex/Box/Button viven en
  [`essentia-ui`](../ui)).
- Un motor de juegos. Es un runtime para **aplicaciones GPU-first**.

## Esto SÍ es

- El `<EssentiaRoot>` que monta el `<Canvas>` Threlte y orquesta todos
  los wrappers internos: cámara, background capture, interactivity,
  environment, suspense.
- La clase `EssentiaNode` que toda primitiva visual extiende.
- El `Engine` context (vía `useEngine()`) que expone viewport reactivo,
  envMap, backgroundTarget y registry de glass meshes.
- Utilidades de cámara (`worldToScreen`, `screenToWorld`).

## Instalación

Workspace package — se resuelve via npm workspaces:

```json
"dependencies": {
  "essentia-core": "*"
}
```

## Uso mínimo

```svelte
<script>
  import { EssentiaRoot } from 'essentia-core'
</script>

<EssentiaRoot background="#0c0c14">
  <!-- contenido — primitivas visuales o layout van acá -->
</EssentiaRoot>
```

## API

- **`<EssentiaRoot>`** — componente raíz. Props: `background`, `envMap`,
  `environment`, `loading`, `class`, `style`.
- **`useEngine()`** — accede al `Engine` context (viewport, camera, etc.).
- **`EssentiaNode`** — clase base para nodos visuales (subclasea para
  crear primitivas custom).
- **`worldToScreen(x, y, viewport)` / `screenToWorld(x, y, viewport)`** —
  conversiones de coordenadas.
- Tipos: `EnvironmentOptions`, `Anchor`, `Bounds`, `Disposable`, `Engine`,
  `Viewport`.

## Roadmap (proyecto completo)

El proyecto Essentia avanza por fases. `essentia-core` cierra Fase 1.
Las fases siguientes agregan capacidades en `essentia-styles` y
`essentia-ui`:

- ✅ **Fase 1** — Engine + cámara ortográfica + EssentiaNode (`core`).
- ✅ **Fase 2** — SDF Rect (`styles`).
- ✅ **Fase 3** — Liquid Glass + Environment Map (`styles`).
- 🟡 **Fase 4** — MSDF Text (`styles`) + Raycasting events (✅ en core
  como `<Interactivity>`). Pendiente: TextNode + componente Text.
- ⏳ **Fase 5** — Hybrid Bridge / Ghost Inputs + primeros higher-level
  components (`Button`, `Card`, `Input` en `ui`).

## Documentación interna

- [.claude/concept.md](.claude/concept.md) — modelo mental del stack
- [.claude/rules.md](.claude/rules.md) — convenciones y restricciones
- [.claude/soul.md](.claude/soul.md) — postura técnica del proyecto
- [CHANGELOG.md](CHANGELOG.md) — historial del paquete
