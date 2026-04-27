uniform float uTime;
uniform float width3D;
uniform float height3D;
uniform vec2 mouse; 
uniform float mouseMagnitude;
uniform float randomFactor; 

attribute vec2 reference;
varying float vAlpha; 

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
}

void main() {
    // 1. ESCALADO
    vec3 worldPos = position;
    worldPos.x *= width3D;
    worldPos.y *= height3D;
    
    // 2. JITTER (Reducido)
    // Hacemos el offset proporcional al tamaño del punto, no arbitrario
    vec3 offset = vec3(
        random(reference),
        random(reference + 1.0),
        0.0
    ) * 2.0 - 1.0; 
    
    // Offset muy sutil solo para romper la rejilla
    worldPos += offset * 0.05; 

    // 3. INTERACCIÓN MOUSE
    // Convertimos worldPos a espacio normalizado [-1, 1] relativo a la caja
    // Usamos max(..., 0.001) para evitar división por cero
    vec2 posNDC = vec2(
        worldPos.x / (max(width3D, 0.001) * 0.5), 
        worldPos.y / (max(height3D, 0.001) * 0.5)
    );
    
    // Corregir aspecto para que el pincel sea redondo
    float aspect = width3D / height3D;
    vec2 aspectCorrection = (aspect > 1.0) ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    
    float dist = distance(posNDC * aspectCorrection, mouse * aspectCorrection);
    
    float influenceRadius = 0.6; 
    float mouseMask = smoothstep(0.2, influenceRadius, dist);
    
    float interaction = mix(1.0, mouseMask, mouseMagnitude);
    vAlpha = interaction;

    // 4. POSICIÓN FINAL
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);

    // 5. TAMAÑO DE PUNTO
    // Reducido a 2.5 para un grano más fino.
    // sizeAttenuation: Si quieres que se vean igual de grandes lejos o cerca,
    // multiplica por una constante. Si quieres perspectiva, usa la fórmula estándar.
    // Para MÁSCARAS de distorsión, a veces es mejor tamaño constante:
    gl_PointSize = 2.5 * (random(reference * 10.0) * 0.5 + 0.5);
}
