# essentia-ui

Capa de **componentes structurales y layout** del stack Essentia UI.
Estructura el contenido de la app — los efectos visuales viven en
`essentia-styles`, el runtime en `essentia-core`.

## Estado actual

Por ahora solo provee re-exports de [`@threlte/flex`](https://next.threlte.xyz/docs/reference/flex/getting-started)
+ [`<Align>`](https://next.threlte.xyz/docs/reference/extras/align) de
`@threlte/extras`. Componentes higher-level (Button, Card, Input) llegarán
en futuras versiones.

## Instalación

```json
"dependencies": {
  "essentia-ui": "*"
}
```

## Exports

- **`<Flex>` / `<Box>`** — layout flexbox basado en Yoga.
- **`<Align>`** — posiciona el centro de un subtree en `(x, y, z)`.
- **`useReflow()`** — fuerza recalcular el layout.
- **`useDimensions()`** — accede a las dimensiones computadas de un Box.
- **`tailwindParser` / `createClassParser`** — clases tipo Tailwind.
- Tipo **`FlexNodeProps`**.

## Uso

```svelte
<script>
  import { EssentiaRoot } from 'essentia-core'
  import { Glass } from 'essentia-styles'
  import { Flex, Box, Align, tailwindParser } from 'essentia-ui'
</script>

<EssentiaRoot>
  <Align x={0} y={0}>
    {#snippet children({ align })}
      <Flex
        width={vw} height={vh}
        classParser={tailwindParser}
        class="flex-row items-center gap-40 p-40"
        onreflow={align}
      >
        <Box flex={1} height={300}>
          {#snippet children({ width, height })}
            <Glass {width} {height} radius={20} />
          {/snippet}
        </Box>
      </Flex>
    {/snippet}
  </Align>
</EssentiaRoot>
```

## Filosofía

`essentia-ui` mantiene la separación entre **estructura** (jerarquía de
contenido, layout) y **estilo** (efectos visuales). El layout es opt-in —
si no usás `essentia-ui`, todo se posiciona absoluto en world space via
`essentia-core`.
