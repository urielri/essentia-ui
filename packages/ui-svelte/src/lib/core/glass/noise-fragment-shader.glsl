varying float perlin; // Recibido del Vertex Shader
uniform vec3 uBaseColor; 
uniform float uTime; // Necesario para variar el color si lo deseas

void main() {
    // 1. Suavizado Circular del Punto
    // Esto hace que el punto se vea como un círculo suave en lugar de un cuadrado.
    float r = distance(gl_PointCoord, vec2(0.5));
    float circleAlpha = 1.0 - smoothstep(0.4, 0.5, r);
    
    // Descartar píxeles fuera del círculo
    if (circleAlpha < 0.01) discard; 

    // 2. Color y Opacidad basadas en Perlin
    
    // Valor de Perlin normalizado (0 a 1)
    float normalizedPerlin = perlin / 1.5; 
    
    // Control de la opacidad: los puntos con ruido bajo (oscuro) son más transparentes
    float opacity = normalizedPerlin * 0.1; 
    
    // Color: Mezcla el color base (uBaseColor) con un color más claro (ej. blanco) basado en el ruido
    vec3 color = mix(uBaseColor, vec3(0.8, 0.8, 0.8), normalizedPerlin);

    // 3. Salida Final
    gl_FragColor = vec4(color, circleAlpha * opacity);
}
