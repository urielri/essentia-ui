// 💡 Vertex Shader: Simplemente pasa la posición y UV al Fragment Shader
export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const fragmentShader = `
  uniform sampler2D tBackground; 
  uniform float iTime;           
  uniform float uDistortion;     
  varying vec2 vUv;             

  void main() {
    // Calcular un desplazamiento basado en tiempo y distorsión
    vec2 offset = vec2(
      sin(vUv.x * 10.0 + iTime) * 0.01 * uDistortion,
      cos(vUv.y * 10.0 + iTime) * 0.01 * uDistortion
    );
    
    // Aplicar el desplazamiento a las coordenadas UV
    vec2 distortedUv = vUv + offset;
    
    // 💡 Leer el color de la textura de fondo en la posición distorsionada
    vec4 background = texture2D(tBackground, distortedUv);
    
    // 💡 Mezclar con un color de vidrio y opacidad
    // Por ejemplo, puedes hacer que el vidrio tenga un tinte azulado y sea semi-transparente
    vec3 glassColor = vec3(0.8, 0.9, 1.0); // Un blanco azulado
    float opacity = 0.7; // Opacidad del vidrio
    
    // Blending simple: (color del fondo * opacidad) + (color del vidrio * (1 - opacidad))
    // Pero para refracción es más directo solo mostrar el background distorsionado con una opacidad global
    gl_FragColor = vec4(background.rgb, opacity); 
  }
`;
