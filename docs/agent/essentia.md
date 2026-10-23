# Essentia: capas, nodos, shaders y demos

Leé esta guía antes de tocar `essentia-core`, `essentia-styles`, `essentia-ui` o `apps/web-svelte`. El modelo mental de cada capa está en su `.claude/concept.md` ([core](../../packages/core/.claude/concept.md), [styles](../../packages/styles/.claude/concept.md), [ui](../../packages/ui/.claude/concept.md)) y la postura técnica en [`soul.md`](../../packages/core/.claude/soul.md): leé el `concept.md` de la capa que vayas a tocar.

## Capas

```
essentia-ui      → layout (Flex/Box/Align) y componentes higher-level (GlassButton, Card)
      │ depende de
      ▼
essentia-styles  → primitivas visuales GPU (Glass, Rect, Image, Text), nodos y shaders
      │ depende de
      ▼
essentia-core    → runtime: EssentiaRoot, engine, cámara 1:1, EssentiaNode, utilidades de cámara
```

- **Dependencia unidireccional:** `core` no importa de `styles` ni de `ui`; `styles` importa de `core`, nunca de `ui`; `ui` puede importar de las dos.
- **Imports entre paquetes por nombre** (`from 'essentia-core'`), nunca por ruta relativa.
- **Dónde va cada cosa:**
  - utilidades de runtime, cámara, proyección y contexto del engine → `core`;
  - todo lo que tiene shader o material → `styles`;
  - composición de primitivas, layout e interacción de alto nivel → `ui`.
- **Mover algo de capa o crear un paquete nuevo es decisión del usuario** (ver `CLAUDE.md`).

## Patrón Node + Shell

Toda primitiva visual se divide en dos archivos:

| Parte | Dónde                                         | Responsabilidad                                                                  |
| ----- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| Node  | `src/nodes/<nombre>-node.ts` (TS puro)        | Geometría, material, uniforms, setters tipados y liberación de recursos GPU      |
| Shell | `src/components/<nombre>.svelte`              | Props → setters del nodo en un `$effect`, registro en el engine, eventos, cleanup |

Referencia: `GlassNode` + `glass.svelte`.

- **El nodo se construye una sola vez** en el shell. Los cambios de props llegan por setters, nunca reconstruyendo el nodo.
- **Sync de props:** un `$effect` que lee props y viewport, llama a los setters y termina con `invalidate()`. Threlte renderiza on-demand: sin `invalidate()` el cambio no se ve hasta el próximo frame que otra cosa dispare.
- **Trabajo asíncrono** (texturas, `sync()` de troika): invalidá de nuevo cuando termina, no solo al pedirlo (ver `TextNode.onSync`).
- **Cleanup:** un `$effect` cuyo retorno llama a `node.destroy()`.
- **`useTask`** solo para trabajo que tiene que correr en cada frame (p. ej. `BackgroundCapture`), no para sincronizar props.
- **Lógica testeable fuera del `.svelte`:** en el nodo o en un `*.config.ts` puro (ver `glass-button.config.ts`).

## Separación CPU / GPU

**Total por defecto.**

- **CPU (Svelte):** estado reactivo (`$state`, `$derived`, `$effect`), eventos del usuario, ciclo de vida, Hybrid Bridge.
- **GPU (nodo y shader):** geometría, materiales, uniforms, render targets, postprocesado, transforms y scene graph.

Si hace falta mezclar (p. ej. leer una medición del canvas para calcular un uniform), documentalo con un comentario que justifique la excepción.

## EssentiaNode

- **Todo elemento visual extiende `EssentiaNode`** (de `essentia-core`). Nada de `Mesh` sueltos como primitiva visual.
- **El nodo es dueño de sus bounds y su anchoring:** no se calculan afuera.
- **Recursos GPU** (geometry, material, render targets, texturas) se registran con `addDisposable()` para liberarse en `destroy()`.
- **Si el `root` puede ser el propio `Mesh`, que lo sea** (como en `GlassNode`): evitá nodos intermedios en el scene graph.

## Primitivas y composición

- **Ortogonales:** ninguna primitiva (`<Glass>`, `<Rect>`, `<Image>`, `<Text>`) acepta children de UI. Cada una renderiza un único mesh con su material.
- **Sin estado oculto:** la fuente de verdad son los props.
- **Composición:** como hermanos en world space (con `x` / `y` / `z`) o dentro de un `<Box>` de `essentia-ui`.
- **Patrones recurrentes** ("Glass + Text + onclick" = botón) viven en `essentia-ui` como componentes higher-level, no en las primitivas.
- **Layout:** el absoluto (`x`, `y`, anchoring) y el declarativo (`<Flex>`/`<Box>`, Yoga) coexisten. Yoga es un solver de constraints, no box model CSS.
- **Coordenadas:** cámara ortográfica 1:1, 1 unidad de mundo = 1 píxel CSS. Las resoluciones de render targets y uniforms de resolución van en píxeles físicos (CSS × DPR).

## Shaders (`essentia-styles/src/shaders`)

- **Archivos `.glsl` separados**, nunca template literals dentro de `.ts` o `.svelte`. Un shader por archivo: `<nombre>.vert.glsl` y `<nombre>.frag.glsl`.
- **Uniforms tipados** en un archivo paralelo `<nombre>.uniforms.ts`, con su tipo (`GlassUniforms`) y una fábrica (`createGlassUniforms`).
- **Nombres:**
  - uniforms con prefijo `u_` y en snake_case, igual en GLSL y en TS (`u_resolution`, `u_chromatic_aberration`);
  - varyings con `v_` (`v_uv`);
  - attributes con `a_` (`a_position`).
- **Unidades y rango** en el comentario del uniform cuando no son obvias (`// pixels`, `[0..1]`).
- **Un parámetro visual nuevo** recorre toda la cadena: uniform en el `.glsl`, tipo y default en `*.uniforms.ts`, opción y setter en el nodo, prop en el shell, test del setter y demo en `/playground` si aplica. El default no debe cambiar cómo se ven las demos existentes.

## Performance

- **Sin allocations en el render loop:** nada de `new Vector3()` por frame; reutilizá instancias.
- **Minimizá draw calls:** evaluá instancing o merging antes de multiplicar meshes.
- **Antes de crear geometría de Three.js** (`BoxGeometry`, `PlaneGeometry` con muchos segmentos), evaluá si un SDF en el shader resuelve lo mismo.
- **Render targets con resolución explícita** en píxeles físicos, nunca con los defaults.
- **Si una decisión tiene costo de performance,** cuantificalo (draw calls, texturas, passes, resolución) al proponerla.

## Lo que nunca se hace

- Resolver un efecto visual con CSS (`backdrop-filter`, `box-shadow`, `border-radius`): todo efecto visual va en shader.
- Usar HTML como superficie de render principal. El DOM es bridge de accesibilidad y eventos.
- `innerHTML` o manipulación directa del DOM fuera del Hybrid Bridge / Ghost Inputs (la única excepción vigente es el cursor vía `useCursor`).
- Importar React, Vue u otra librería de UI.
- Que `essentia-core` conozca a `Glass`, `Rect`, `Image` o `Text`.

## API pública y versiones

- **Lo público es lo que exporta el barrel** (`core.ts`, `styles.ts`, `ui.ts`). Un export nuevo, un prop nuevo o un cambio de default es un cambio de API: proponelo antes.
- **Cada cambio lleva su entrada en el CHANGELOG del paquete** y, al cerrar una fase, su bump de versión (ver [`git.md`](./git.md)).
- **README y `concept.md` del paquete** se actualizan cuando cambia la API o el modelo.

## Demos (`apps/web-svelte`)

- **Una ruta por demo** en `src/routes/<nombre>-demo/` (o un nombre descriptivo, como `playground`), con `+page.svelte`, `+page.js` y la escena en un componente kebab-case aparte (`text-demo.svelte`).
- **Toda primitiva o componente nuevo suma su demo**, y la landing (`/`) la enlaza.
- **Assets** en `static/`. Los `.hdr` y `.exr` están en `.gitignore`: una demo que los necesita tiene que degradar sin ellos o documentar de dónde salen (ver [`traps.md`](./traps.md)).
- **Verificación:** `npm run dev:svelte --workspace=web-svelte` y revisá en el navegador la demo afectada y las existentes que usan la misma primitiva.
