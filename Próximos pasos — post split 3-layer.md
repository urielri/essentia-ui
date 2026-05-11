# Próximos pasos — post split 3-layer
## Contexto
El refactor a 3 paquetes (`essentia-core`, `essentia-styles`, `essentia-ui`) está completo y pusheado en `refactor/3-layer-split`. Una vez mergeado, hay 4 hilos abiertos a ordenar.
## Hilos abiertos
1. **Post-merge cleanup**: ajustes pequeños al `concept.md`/`rules.md` de `essentia-core` que todavía hablan como si la lib fuera monolítica.
2. **Fase 4 — MSDF Text**: plan detallado ya existe (anterior a la reorg). Necesita ajuste para aterrizar en `essentia-styles`. Cierra Fase 4 del roadmap del README (raycasting ya está hecho).
3. **Glass shader refinement** (deferred): el modelo "panel plano viewed head-on" requiere reemplazar `curvature` por `surfaceRoughness` + mezcla vía Fresnel. Quedaba pausado cuando arrancó la conversación del refactor.
4. **Fase 5 preview**: Ghost Inputs (a11y bridge) y primeros componentes higher-level (`<GlassButton>`, `<Card>`) — todavía en TBD del CONCEPT.md.
## Orden propuesto
### Step 1 — Mergear `refactor/3-layer-split` (manual, fuera de plan)
Acción del usuario: revisar PR, mergear a `main`. Nada de código nuevo hasta que esté mergeado.
### Step 2 — Cleanup docs en core
* Releer `packages/core/.claude/concept.md` y filtrar referencias a Glass/Rect/Image que ahora viven en styles.
* Releer `packages/core/.claude/rules.md`. Las reglas siguen vigentes pero mencionan shaders y nodos GPU que migraron — reformular o explicitar que aplican al stack completo, no solo a core.
* Revisar `packages/core/README.md` (heredado del monolítico) y reducir scope al runtime.
Costo: ~30min.
### Step 3 — Glass shader refinement (1 sesión acotada)
Deferred del modelo "panel plano viewed head-on". Cambios en `packages/styles/src/shaders/glass.frag.glsl` + `glass.uniforms.ts`:
* Reemplazar `curvature` (hack) por `surfaceRoughness` (uniform [0..1]) que perturba el normal con ruido procedural sutil.
* Convertir el aporte IBL de aditivo a mezcla via Fresnel-Schlick (F0=0.04 para vidrio): centro deja pasar refracción pura, bordes muestran reflejo.
* Exponer `surfaceRoughness` como prop en `<Glass>`. Tunear defaults para que demos existentes (`/`, `/product`, `/playground`) sigan viéndose bien.
* Tests: agregar 2-3 casos en `glass-node.test.ts` para `setSurfaceRoughness` + `setFresnelStrength`.
Costo: ~3h. **Antes de Fase 4** porque cambia la API visual del Glass que el demo de Text va a usar.
### Step 4 — Fase 4: MSDF Text en `essentia-styles`
El plan detallado existe (`Essentia UI — Fase 4: MSDF Text`). Delta a aplicar por la reorg:
* Archivos nuevos viven en `packages/styles/src/`:
    * `nodes/text-node.ts`
    * `components/text.svelte`
    * `nodes/__tests__/text-node.test.ts`
* Exportar `Text` y `TextNode` desde `packages/styles/src/styles.ts`.
* Demo route `apps/web-svelte/src/routes/text-demo/` usa `essentia-core` + `essentia-styles` + `essentia-ui`.
* CHANGELOG: agregar entrada `[Unreleased]` en `packages/styles/CHANGELOG.md`.
* Bumps de versión al cierre de Fase 4: `essentia-styles: 0.1.0 → 0.2.0` (minor: nueva primitiva). `essentia-core` queda en `0.1.0` (no hay cambios runtime). `essentia-ui` queda en `0.0.0`.
Resto del plan original sigue vigente: motor troika, `TextNode extends EssentiaNode`, composición como hermano (NO children de Glass), Suspense via `useSuspense()`, anchoring traducido a strings de troika.
Costo: ~5h (sin cambios respecto al plan original).
### Step 5 — Fase 5 preview (NO se ejecuta aún, solo se documenta)
Después de cerrar Fase 4, los próximos hitos a evaluar:
* **Ghost Inputs / Hybrid Bridge**: proyectar `<input>` invisible vía DOM en world coords usando `node.root.matrixWorld` + `worldToScreen`. Habilita foco/teclado/clipboard sobre primitivas GPU. Pertenece a `essentia-core` (utilidades) y `essentia-ui` (componentes Input).
* **Primeros higher-level components** en `essentia-ui`: `<GlassButton>`, `<Card>`. Componen `<Glass>` + `<Text>` + handlers + cursor. `essentia-ui` bumps a `0.1.0` cuando aparezca el primer componente.
Decisión a tomar: ¿Fase 5 prioriza Ghost Inputs (infra) o higher-level components (visible feature)? Definir antes de arrancar.
Costo: ~10-15h estimado, depende de scope.
## Decisiones pendientes a resolver durante la ejecución
* **Fonts default en Text**: ¿la lib trae una fuente embebida o el consumidor la pasa siempre? Sugerencia: NO embebida.
* **Surface roughness defaults**: tras el spike del shader, decidir el valor por defecto que no rompa demos (probable: `0.0` para mantener Glass actual + opt-in via prop).
* **Higher-level components**: ¿viven en `essentia-ui` directamente o en un sub-paquete `essentia-ui-kit`? Empezar en `essentia-ui` y separar si crece demasiado.
## Out of scope
* Generación estática de atlas MSDF con `msdf-atlas-gen`.
* Shader propio MSDF que reemplace troika.
* Migración de `Rect`/`Image` al patrón nodo (`RectNode`, `ImageNode`).
* Publicación a npm — sigue siendo workspace privado.
* Integración con changesets para bumps automáticos — manual por ahora.
## Resumen ejecutivo
```warp-runnable-command
[ahora]   Step 1: Merge refactor PR (manual, usuario)
[+30min]  Step 2: Cleanup docs en core
[+3h]     Step 3: Glass shader refinement (surfaceRoughness)
[+5h]     Step 4: Fase 4 — MSDF Text (cierra Fase 4 del README)
[+TBD]    Step 5: Fase 5 — Ghost Inputs y/o higher-level components
```
