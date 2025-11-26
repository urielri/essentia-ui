varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    // Calcular la posición del vértice en coordenadas de vista (View Space)
    // Esto es necesario para calcular el vector de vista (V) en el fragment shader
    vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
