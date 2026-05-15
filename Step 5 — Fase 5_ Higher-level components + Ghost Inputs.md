# Step 5 — Fase 5: Higher-level components + Ghost Inputs
## Problema
La cadena `core → styles → ui` está completa pero `essentia-ui` (0.0.0) solo expone re-exports de layout (`Flex`, `Box`, `Align`). No hay componentes higher-level que demuestren la composición de primitivas, ni soporte para input de teclado/foco/clipboard sobre meshes GPU. Fase 5 cubre ambos hilos, en dos sub-fases ordenadas para entregar valor visible primero.
## Estado actual
* `essentia-ui@0.0.0`: solo `Flex`, `Box`, `useReflow`, `useDimensions`, `tailwindParser`, `createClassParser`, `Align`. Sin componentes propios.
* `essentia-styles@0.2.0`: `Rect`, `Image`, `Glass`, `Text` + nodos (`GlassNode`, `TextNode`).
* `essentia-core@0.1.0`: `EssentiaRoot`, `EssentiaNode`, `useEngine`, `worldToScreen`/`screenToWorld` ya implementadas en `core/camera.ts` — base perfecta para Ghost Inputs.
## Sub-fases
### Sub-fase 5A (prioritaria) — Higher-level components
Valor visible inmediato. Demuestra la composición `Glass + Text + handlers + cursor` que el concept.md documenta como "futuro". Sin dependencia de teclado.
#### Componentes a entregar
##### `<GlassButton>` (`packages/ui/src/components/glass-button.svelte`)
Composición: `<Glass>` con `cursor='pointer'` + `<Text>` centrado sobre el panel.
Props:
* `label: string` — texto del botón (required)
* `width?, height?` — default 160 x 44
* `onclick?` — handler tipado vía `InteractivityProps`
* `variant?: 'primary' | 'secondary' | 'ghost'` — mapea a defaults de `tint`, `tintOpacity`, `fresnelStrength` y `color` del texto.
* `disabled?: boolean` — reduce opacidad y desactiva `onclick`.
* `radius?, fontSize?, x?, y?, z?` — passthroughs.
##### `<Card>` (`packages/ui/src/components/card.svelte`)
Contenedor de superficie + contenido. Composición: `<Glass>` con `blur` opcional como background + un snippet hijo (slot) para colocar `<Text>` o cualquier primitiva como hermanos posicionados via `x`/`y`/`z`.
Props:
* `width, height` — required
* `radius?` — default 16
* `blur?` — default 4 (frosted glass)
* `tint?, tintOpacity?` — passthroughs
* `x?, y?, z?` — posición
* `children` snippet — contenido (typicamente Text, Image, GlassButton).
No intenta hacer layout interno del contenido. La composición continúa siendo "hermanos en world space". Para layouts más ricos, el consumidor usa `<Flex>/<Box>` dentro.
#### Archivos nuevos
* `packages/ui/src/components/glass-button.svelte`
* `packages/ui/src/components/card.svelte`
* `packages/ui/src/components/__tests__/glass-button.test.ts` (3-4 tests basados en setup de svelte: render via @testing-library/svelte; o sub-tests sobre nodo si no podemos montar Threlte en jsdom — ver Decisión abajo).
* Actualizar `packages/ui/src/ui.ts`: exports de `GlassButton`, `Card`.
* `packages/ui/CHANGELOG.md` (nuevo archivo) — entrada `[0.1.0]`.
* `apps/web-svelte/src/routes/components-demo/+page.svelte` + `+page.js` — showcase de los componentes.
#### Versioning
* `essentia-ui: 0.0.0 → 0.1.0` (primer componente higher-level).
#### Decisión abierta: testing de componentes Svelte
Los tests de `essentia-styles` corren sobre nodos directamente (sin renderer). Para `<GlassButton>` necesitamos montar el componente o testear vía nodo subyacente. Opciones:
1. **Test del rendering Svelte** con `@testing-library/svelte` (requiere jsdom + montar). Riesgo: Threlte/T no monta bien sin canvas real.
2. **Test del comportamiento via dependency injection**: refactorizar GlassButton para exponer una función pura `buildGlassButtonState(props)` que devuelve los uniforms/props finales. Tests sobre la función.
Propuesta: empezar con (2) — más alineado al patrón del repo y suficiente para validar variants/defaults. Si la lógica es trivial, considerar dejar al smoke test del demo.
#### Costo estimado
Aproximadamente 4 horas:
* 1h: GlassButton + variants
* 1h: Card + composición con children snippet
* 1h: Tests + demo route
* 1h: Docs (CHANGELOG, concept.md)
### Sub-fase 5B (deferred-able) — Ghost Inputs / Hybrid Bridge
Infraestructura para foco/teclado/clipboard sobre primitivas GPU. Habilita `<Input>`, `<Textarea>`, contentEditable real sobre meshes. Pertenece a `essentia-core` (utilidades de bridge) y `essentia-ui` (componentes consumidores).
#### Arquitectura
Ghost Input = `<input>` DOM invisible posicionado en screen-space en sync con la posición world-space de un nodo GPU. El usuario ve solo el render GPU (Text), pero el DOM maneja teclado, IME, clipboard, accesibilidad.
##### Pipeline
1. `<GhostInputBridge>` (componente en `essentia-core`) registra un `<input>` overlay en el DOM root del `EssentiaRoot`.
2. Cada frame (o on-change reactivo), calcula la posición screen-space con `worldToScreen(node.root.matrixWorld extracted xyz, viewport)`.
3. Aplica `transform: translate(x, y)` al `<input>`, con `opacity: 0` y `pointer-events: auto`.
4. Eventos DOM (`input`, `keydown`, `focus`, `blur`) se propagan vía callbacks al estado Svelte del componente consumidor.
5. El consumidor renderiza un `<Text>` GPU que refleja el `value` del input.
#### Archivos nuevos
* `packages/core/src/lib/bridge/ghost-input-bridge.svelte` — utility component
* `packages/core/src/lib/bridge/ghost-input.types.ts` — types compartidos
* `packages/core/src/lib/bridge/__tests__/ghost-input-bridge.test.ts`
* `packages/ui/src/components/input.svelte` — consumidor: Glass + Text + GhostInput
* `packages/ui/src/components/__tests__/input.test.ts`
* Demo route `apps/web-svelte/src/routes/input-demo/`
#### Cuestiones técnicas a resolver
* **DPR + scroll**: la fórmula screen-space necesita compensar offset del canvas en la página.
* **Selection rendering**: troika no soporta selection nativamente; v0 sin selection visual (cursor parpadeante simple) o overlay con `<Rect>` semi-transparente.
* **IME (Asian languages, dead keys)**: dejar al DOM nativo. v0 acepta esto.
* **Accessibility**: el `<input>` invisible mantiene `tabindex`, `aria-label`. Screen readers ven el DOM real.
#### Costo estimado
Aproximadamente 8-10 horas. Es la sub-fase más riesgosa por las consideraciones de cross-browser y edge cases.
## Decisiones a resolver durante ejecución
* **Snippets en Card**: Svelte 5 snippets vs children prop — confirmar idiom del proyecto (mirar `glass.svelte` ui snippet).
* **Variants de GlassButton**: paleta concreta (probablemente expuesta vía design tokens centralizados, futuro).
* **Dónde van design tokens**: ¿`essentia-styles` o `essentia-ui`? Sugerencia: `essentia-ui/tokens` cuando aparezca el primer caso de uso real.
## Plan de entrega recomendado
1. **Sub-fase 5A** completa, mergeada y validada en demos.
2. **Pausa para feedback** del consumidor / diseño.
3. **Sub-fase 5B** opcional, en branch separada (puede dejarse para Fase 6 si el scope crece).
## Out of scope
* Form validation / state machines.
* Animations (transitions, hover micro-interactions) — dejar para Fase 6.
* Design tokens centralizados — emergen del primer dolor.
* Selection rendering rico (highlighted selection blocks) en Ghost Inputs.
* `<Modal>`, `<Tooltip>`, layouts más complejos.
## Resumen ejecutivo
* 5A: `<GlassButton>` + `<Card>` → `essentia-ui@0.1.0`, ~4h.
* 5B: Ghost Input Bridge + `<Input>` → ~8-10h, branch separada.
