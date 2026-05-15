Lee [soul](.claude/soul.md) antes de cualquier tarea.

# VistAlba — Compresión de contexto

VistAlba reduce el uso de tokens comprimiendo JSON y código fuente antes de que entren al contexto.
Está disponible como servidor MCP con las siguientes herramientas.

## Regla: archivos JSON

**Siempre usar `read_json` (vistalba) en lugar del tool `Read` estándar para archivos `.json`.**

```
# En lugar de:
Read("data/users.json")

# Usar:
read_json(path="data/users.json", session_id="<session-id>")
```

Esto aplica a TODOS los agentes, INCLUYENDO sub-agentes y tareas internas.

## Regla: archivos de código fuente

**Usar `read_code` (vistalba) en lugar del tool `Read` estándar para archivos de código (`.rs`, `.ts`, `.py`, `.js`, etc.).**

```
# En lugar de:
Read("src/lib.rs")

# Usar:
read_code(path="src/lib.rs", session_id="<session-id>")

# Para leer solo una función o struct (60-80% de ahorro):
read_code(path="src/lib.rs", session_id="<session-id>", symbol="compress_inner")
```

`read_code` elimina comentarios inline y de bloque, colapsa líneas en blanco, y preserva
doc comments (`///`, `/** */`) y strings literales. Ahorro típico: 15–30% sin `symbol`,
60–80% con `symbol`.

## Formatos comprimidos

Los datos que VistAlba entrega al contexto pueden venir en cuatro formatos. El modelo debe
interpretarlos directamente — son semánticamente equivalentes a su JSON original.

**JTON** — arrays de objetos homogéneos (primera aparición del schema en la sesión):
```
[N: col1, col2, col3; val1, val2, val3; val4, val5, val6]
```
- `N` = número de filas
- Separador de columnas: `,`
- Separador de filas: `;`

**schema_ref** — misma tabla, segundo envío en adelante (schema ya conocido):
```
schema_ref:a3f9c1b7
val1, val2, val3
val4, val5, val6
```
El hash referencia el schema enviado en un turno anterior. Solo se transmiten las filas.

**delta** — misma tabla con cambios incrementales (≥70% de filas comunes):
```
delta_ref:a3f9c1b7
-3
+1: Alice, admin
~0: role; superadmin
```
- `-N` elimina la fila en posición N del estado anterior
- `+N: vals` inserta una fila nueva en posición N
- `~N: col; val` modifica una columna en la fila N

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
| `read_json` | Lee y comprime un archivo `.json` en un paso |
| `read_code` | Lee un archivo de código con strip de comentarios. `symbol` extrae solo una función/struct |
| `compress` | Comprime un string JSON a JTON/Onto |
| `decompress` | Revierte JTON, Onto, schema_ref o delta a JSON estándar |
| `get_savings` | Muestra tokens ahorrados en la sesión |
