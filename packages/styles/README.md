# essentia-styles

Capa de **primitivas visuales** del stack Essentia UI. Cada componente es
una primitiva GPU-first: shape SDF, textura, efecto. Ortogonales entre sí
— ninguna acepta children. La jerarquía es responsabilidad de la layer
estructural (`essentia-ui`).

Depende de [`essentia-core`](../core) para el runtime.

## Instalación

Workspace package — se resuelve via npm workspaces. En el consumidor:

```json
"dependencies": {
  "essentia-core": "*",
  "essentia-styles": "*"
}
```

## Componentes

- **`<Rect>`** — shape SDF con bordes redondeados.
- **`<Image>`** — textura con SDF rounded corners. Cache compartido.
- **`<Glass>`** — efecto liquid glass (refracción + IBL + Fresnel).

## Nodos

- **`GlassNode extends EssentiaNode`** — abstracción imperativa del Glass.

## Uso

```svelte
<script>
  import { EssentiaRoot } from 'essentia-core'
  import { Rect, Image, Glass } from 'essentia-styles'
</script>

<EssentiaRoot background="#0c0c14">
  <Rect width={200} height={200} radius={20} color="#6c63ff" x={-150} />
  <Image src="/photo.jpg" width={300} height={400} radius={16} />
  <Glass width={260} height={120} radius={20} ior={1.4} blur={4} />
</EssentiaRoot>
```

## Documentación interna

Ver `.claude/concept.md`.
