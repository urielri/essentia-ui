---
name: Essentia Core — Rules
description: Puntero a las convenciones del stack Essentia, que viven en docs/agent/
---

# Rules

Las convenciones del stack completo (`essentia-core`, `essentia-styles`,
`essentia-ui` y las demos) se movieron a las guías de agente de la raíz,
que son la fuente única de verdad:

- [`AGENTS.md`](../../../AGENTS.md) — reglas transversales y Definition of Done
- [`docs/agent/essentia.md`](../../../docs/agent/essentia.md) — capas, patrón
  Node + Shell, separación CPU/GPU, `EssentiaNode`, composición, shaders,
  performance y lo que nunca se hace
- [`docs/agent/code.md`](../../../docs/agent/code.md) — archivos, imports,
  tipos, comentarios y tests

Si una regla cambia, se actualiza ahí, no en este archivo.
