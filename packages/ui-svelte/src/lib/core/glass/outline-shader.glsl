uniform sampler2D tNormal;     // Textura que contiene las Normales de la malla (en View Space)
uniform vec2 uResolution;      // Resolución del viewport
uniform float uOutlineStrength; // Intensidad del brillo del borde
uniform vec3 uOutlineColor;    // Color base del borde
uniform float uFresnelPower;    // Potencia del efecto Fresnel (ej. 2.0 - 5.0)

varying vec2 vUv;

void main() {
    // 1. Obtener la Normal de la superficie del Render Target (Normal Map)
    // Asumimos que la normal está codificada en el espacio de vista (View Space)
    // Decodificar el color RGB de la textura a un vector Normal (-1 a 1)
    vec3 normalColor = texture2D(tNormal, vUv).rgb;
    
    // Si la normal es (0, 0, 0), significa que el píxel está vacío (fuera del objeto)
    // Esto actúa como nuestra máscara de borde inicial.
    if (dot(normalColor, normalColor) < 0.0001) {
        discard;
    }
    
    // El MeshNormalMaterial de Three.js renderiza las normales en el espacio de la cámara (View Space),
    // donde X, Y, Z se mapean a RGB (0, 0, 0) a (1, 1, 1).
    // Decodificamos de vuelta a (-1, -1, -1) a (1, 1, 1) y normalizamos.
    vec3 VNormal = normalColor * 2.0 - 1.0;
    
    // 2. Calcular el Vector de Vista (View Vector)
    // En el View Space, el vector de vista (V) para una cámara ortográfica (o cuando se mira a Z=0)
    // es simplemente la dirección opuesta a la cámara, que es (0, 0, 1) en View Space.
    // Para una vista centrada, podemos asumir que la dirección de vista es constante
    // (o usar la posición de vista del vertex shader si la geometría es compleja, pero para un plano es simple).
    vec3 V = vec3(0.0, 0.0, 1.0); // Vector de vista hacia el observador (en View Space)
    
    // 3. Cálculo de Fresnel
    // Usamos el producto punto entre el vector de vista y la normal.
    // dot(N, V) es 1.0 cuando miras la normal de frente, y 0.0 cuando miras de soslayo.
    // Queremos el efecto inverso: máximo en los bordes.
    
    float angleFactor = 1.0 - abs(dot(VNormal, V)); // 1.0 en el borde, 0.0 en el centro
    
    // Aplicar la potencia (uFresnelPower) para controlar la "dureza" del brillo
    float fresnelMask = pow(angleFactor, uFresnelPower);
    
    // 4. Salida
    
    // El factor de brillo es controlado por la máscara Fresnel.
    vec3 finalOutline = uOutlineColor * fresnelMask * uOutlineStrength;

    // Usamos el valor Fresnel como Alpha para el AdditiveBlending
    gl_FragColor = vec4(finalOutline, fresnelMask);
}
