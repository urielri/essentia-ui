<script lang="ts">
  import { T } from "@threlte/core";
</script>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[5, 5, 5]} intensity={1} />

<!-- Contenido de ejemplo en cada "vista" -->
<T.Mesh position={[0, 0, 0]}>
  <T.BoxGeometry args={[2, 2, 2]} />
  <T.MeshStandardMaterial color="#00ffcc" />
</T.Mesh>

<T.Mesh position={[15, 0, 0]}>
  <T.SphereGeometry args={[1.5, 32, 32]} />
  <T.MeshStandardMaterial color="#ff6600" />
</T.Mesh>

<T.Mesh position={[-15, 0, 0]}>
  <T.ConeGeometry args={[1, 2, 32]} />
  <T.MeshStandardMaterial color="#6600ff" />
</T.Mesh>
