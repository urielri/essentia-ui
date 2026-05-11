# Essentia UI

Lee estos archivos antes de cualquier tarea:

- [Concept](.claude/concept.md) — modelo mental: structural components y layout

Este paquete es la capa estructural superior. Puede depender de
[`essentia-core`](../core/) y [`essentia-styles`](../styles/), pero no al
revés. Flujo: `ui → styles → core`.

# VistAlba — Compresión de contexto

VistAlba reduce el uso de tokens comprimiendo JSON antes de que entre al contexto.
Está disponible como servidor MCP con las siguientes herramientas:

## Regla: archivos JSON

**Siempre usar `read_json` (vistalba) en lugar del tool `Read` estándar para archivos `.json`.**

```
# En lugar de:
Read("data/users.json")

# Usar:
read_json(path="data/users.json", session_id="<session-id>")
```

Esto aplica a TODOS los agentes, INCLUYENDO sub-agentes y tareas internas.

## Formatos comprimidos

**JTON** — arrays de objetos homogéneos:
```
[N: col1, col2, col3; val1, val2, val3; val4, val5, val6]
```
- `N` = número de filas
- Separador de columnas: `,`
- Separador de filas: `;`

**Onto** — objetos con anidamiento profundo (depth > 2):
```
clave:
  subclave: valor
  lista: [a, b, c]
  items:
    -
      campo: valor
```

## Chain of Draft

Cada paso de razonamiento interno: ≤ 5 palabras. Formato: `· <paso>`

## Herramientas disponibles

| Tool | Descripción |
|------|-------------|
| `read_json` | Lee y comprime un archivo .json en un paso |
| `compress` | Comprime un string JSON a JTON/Onto |
| `decompress` | Revierte JTON/Onto a JSON estándar |
| `get_savings` | Muestra tokens ahorrados en la sesión |
