uniform sampler2D tNormal;
uniform vec2 uResolution;
uniform float uOutlineStrength;
uniform vec3 uOutlineColor;
uniform float uFresnelPower;
uniform float uBorderRadius; 

// NUEVO UNIFORM: Las dimensiones normalizadas (ancho, alto) del cubo 3D proyectado en el viewport (en el espacio [-1, 1]).
uniform vec2 uBoxNormalizedSize; 

varying vec2 vUv;

// Función SDF para una Caja Redondeada
float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

void main() {
    // 1. Obtener la normal del render target
    vec4 normalSample = texture2D(tNormal, vUv);
    
    // Si el valor alfa es muy bajo, no hay objeto aquí
    if (normalSample.a < 0.01) discard;
    
   //gl_FragColor = vec4(normalSample.rgb, 1.0); return; 
    // Decodificación de la normal al espacio de vista (View Space)
    vec3 viewNormal = normalize(normalSample.rgb * 2.0 - 1.0);
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Dirección de la vista en View Space
    
    // Cálculo de Fresnel: resalta los bordes que miran lejos de la cámara
    float NdotV = abs(dot(viewNormal, viewDir));
    float fresnelFactor = pow(1.0 - NdotV, uFresnelPower);

    // Lógica de Intensidad Estática (se puede usar para un brillo base)
    float staticIntensity = 1.0;
    
    // ----------------------------------------------------
    // LÓGICA SDF: Máscara de Borde Redondeado y Escala
    // ----------------------------------------------------
    
    // 1. Coordenadas centradas en el viewport [-1, 1]
    vec2 p = vUv * 2.0 - 1.0;
    
    // 2. Corregir la relación de aspecto del *viewport* en las coordenadas
    float aspect = uResolution.x / uResolution.y;
    p.x *= aspect; 
    
    // 3. Definir las dimensiones de la caja SDF (Medio ancho/alto)
    // Usamos el tamaño proyectado (uBoxNormalizedSize) y lo dividimos por 2 
    // para obtener el medio ancho y medio alto, ya que NDC va de -1 a 1.
    vec2 boxSize = uBoxNormalizedSize * 0.5; 
    
    // 4. Corregir la dimensión X de la caja para que coincida con el espacio 'p.x'
    // Multiplicamos el medio ancho de la caja por el factor de aspecto.
    boxSize.x *= aspect; 
    
    // 5. Calcular la distancia (SDF)
    // El radio debe ser pequeño para que la esquina sea solo visible en el borde del cubo
    float dist = sdRoundedBox(p, boxSize, vec4(uBorderRadius)); 
    
    // 6. Crear la Máscara: solo dibuja donde la distancia es cercana a 0 (el borde)
    float thickness = 0.01; // Grosor del contorno
    float sdfMask = 1.0 - smoothstep(-thickness, thickness, dist); 
    
    // ----------------------------------------------------

    // 7. Combinar Fresnel con la Máscara SDF
    float finalIntensity = fresnelFactor * staticIntensity * sdfMask;
    
    vec3 finalColor = uOutlineColor * finalIntensity * uOutlineStrength;
    
    gl_FragColor = vec4(finalColor, finalIntensity);
}
