# Step 4 — Fase 4: MSDF Text en essentia-styles
## Problema
La capa de estilos (`essentia-styles`) aún carece de una primitiva de texto. El pipeline visual necesita soporte para renderizar texto tipográficamente escalable (MSDF — Multi-channel Signed Distance Fields) vía troika.js, manteniendo la ortogonalidad: cada componente = mesh único sin estado interno.
## Estado actual
La reorg a 3 paquetes está completa. El plan original de Fase 4 existe pero requiere ajustarse para:
* Aterrizar archivos en `packages/styles/src/`
* Exportar desde `styles.ts`
* Demo vive en `apps/web-svelte/src/routes/text-demo/`
* Bumps de versión: `essentia-styles: 0.1.0 → 0.2.0`
## Cambios necesarios
### 1. TextNode (`packages/styles/src/nodes/text-node.ts`)
Encapsula la lógica GPU de texto MSDF:
* Clase `TextNode extends EssentiaNode`
* Inicializa troika `Text` mesh internamente
* Métodos setter chainables: `setText()`, `setFontSize()`, `setColor()`, `setAlignment()`, `setAnchorX()`, `setAnchorY()`, `setFont()`, `setMaxWidth()`, `setLineHeight()`
* Gestión de disposables: liberar troika mesh en `destroy()`
### 2. Componente Svelte (`packages/styles/src/components/text.svelte`)
Shell reactivo que sincroniza props → setters:
* Props: `text` (required), `fontSize`, `color`, `font`, `alignment`, `anchorX`, `anchorY`, `maxWidth`, `lineHeight`, `x`, `y`, `z`
* Single `$effect()` sincroniza props → setters
* Suscripción a `engine.viewport` para reescalado dinámico
### 3. Tests (`packages/styles/src/nodes/__tests__/text-node.test.ts`)
Cobertura de setters y lifecycle:
* Construcción: `root` es `Object3D`, `mesh` existe
* Defaults validados
* Cada setter actualiza troika sin errores
* Chainable: todos los setters devuelven `this`
* Cleanup: `destroy()` dispone troika mesh
### 4. Exports (`packages/styles/src/styles.ts`)
Agregar a surface API:
* `export { TextNode } from './nodes/text-node'`
* `export { default as Text } from './components/text.svelte'`
### 5. CHANGELOG (`packages/styles/CHANGELOG.md`)
Entrada [Unreleased] con features de Text
### 6. Demo route (`apps/web-svelte/src/routes/text-demo/+page.svelte`)
Showcase interactivo con 3-5 ejemplos, composición Text + Glass, sliders interactivos
### 7. Versioning
Bumps al finalizar Fase 4:
* `essentia-styles: 0.1.0 → 0.2.0`
* Otros paquetes sin cambios
## Decisiones de diseño
### Fonts
No embebidas. Default: Google Fonts Poppins vía CDN. Usuario puede override con prop `font` (URL custom)
### Suspense
Troika carga fonts async. Usar `$effect.pre()` para observar cuando troika está listo
### Anchoring
Troika usa strings. TextNode traduce props numéricas `anchorX: 0 to 1` a strings troika internamente
### Layout
Sin auto-layout. Text es mesh ortogonal sin hijos. Composición explícita como hermanos o dentro de Box
## Costo estimado
Aproximadamente 5 horas:
* 1h: TextNode + métodos (troika integration)
* 1h: Componente .svelte + sincronización reactiva
* 1h: Tests
* 1h: Demo route
* 1h: Documentación y exports
## Dependencias externas
* `troika-three-text` v0.47.x
* `essentia-core` y Three.js
## Out of scope
* Atlas MSDF personalizado
* Shader MSDF custom
* Animaciones tipográficas
* Input integrado
## Validación post-merge
* `/text-demo/` renderiza correctamente
* `<Text>` compone bien al lado de `<Glass>` y `<Rect>`
* Font custom vía prop funciona
* Responsive: fontSize se ajusta con viewport
