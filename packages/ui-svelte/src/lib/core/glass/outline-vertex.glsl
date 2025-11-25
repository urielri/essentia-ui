varying vec2 vUv;

void main() {
    // 1. Pasar las Coordenadas UV al Fragment Shader
    vUv = uv;

    // 2. Proyectar directamente al espacio de la pantalla (NDC [-1, 1])
    gl_Position = vec4(position, 1.0);
// gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
