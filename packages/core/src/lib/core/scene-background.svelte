<script lang="ts">
  import { Color } from 'three'
  import { useThrelte } from '@threlte/core'

  interface Props {
    color: string
  }

  let { color }: Props = $props()

  const { scene } = useThrelte()

  $effect(() => {
    scene.background = new Color(color)
    return () => {
      scene.background = null
    }
  })
</script>
