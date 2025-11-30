<script lang="ts">
  import { T } from "@threlte/core";
  import * as THREE from "three";

  export let inputTexture: THREE.Texture | null = null;
  export let blurAmount: number = 5.0;

  const blurVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const blurFragmentShader = `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uBlurAmount;
    varying vec2 vUv;
    
    void main() {
      vec2 texelSize = 1.0 / uResolution;
      vec4 color = vec4(0.0);
      float total = 0.0;
      
      // Blur gaussiano simple (9 samples)
      for(float x = -1.0; x <= 1.0; x++) {
        for(float y = -1.0; y <= 1.0; y++) {
          vec2 offset = vec2(x, y) * texelSize * uBlurAmount;
          float weight = 1.0; // Simplificado, puedes usar pesos gaussianos
          color += texture2D(tDiffuse, vUv + offset) * weight;
          total += weight;
        }
      }
      
      gl_FragColor = color / total;
    }
  `;

  $: uniforms = {
    tDiffuse: { value: inputTexture },
    uResolution: { value: new THREE.Vector2(512, 512) },
    uBlurAmount: { value: blurAmount },
  };
</script>

<T.Mesh>
  <T.PlaneGeometry args={[2, 2]} />
  <T.ShaderMaterial
    vertexShader={blurVertexShader}
    fragmentShader={blurFragmentShader}
    {uniforms}
    depthTest={false}
    depthWrite={false}
  />
</T.Mesh>
