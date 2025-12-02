uniform sampler2D tNormal;
uniform vec2 uResolution;
uniform float uOutlineStrength;
uniform vec3 uOutlineColor;
uniform float uFresnelPower;
uniform float uBorderRadius; 
uniform vec2 uBoxNormalizedSize; 
uniform float uDpr;

uniform vec2 uMouse; 
uniform float uMouseMagnitude; 

varying vec2 vUv;

float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

void main() {
    vec4 normalSample = texture2D(tNormal, vUv);

    if (normalSample.a < 0.01) {
        discard;
    }
    
    // 1. Normal Física
    vec3 viewNormal = normalize(normalSample.rgb * 2.0 - 1.0);
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float physicalNdotV = abs(dot(viewNormal, viewDir));

    // 2. Coordenadas SDF
    vec2 p = vUv * 2.0 - 1.0; 
    float viewportAspect = uResolution.x / uResolution.y;
    p.x *= viewportAspect;

    // 3. Tamaño y forma
    vec2 boxSize = vec2(uBoxNormalizedSize.x, 1.0);
    float shapeRadius = uBorderRadius * min(boxSize.x, boxSize.y);
    
    // 4. Distancia SDF
    float dist = sdRoundedBox(p, boxSize, vec4(shapeRadius));
    
    // 5. Anchura del Fresnel
    float targetPixelWidth = 2.0; 
    float pixelToSdfScale = 3.0 / uResolution.y;
    float fresnelWidth = (targetPixelWidth * uDpr) * pixelToSdfScale;
    
    float curveFactor = smoothstep(-fresnelWidth, 0.0, dist);
    
    // 6. Fresnel Virtual
    float virtualNdotV = physicalNdotV * (1.0 - pow(curveFactor, 2.0));
    float fresnelFactor = pow(1.0 - virtualNdotV, uFresnelPower);

    // 7. Máscara de clip
    float alphaMask = 1.0 - smoothstep(0.0, 0.01, dist);
    

    // --- MÁSCARA DIRECCIONAL CON ROTACIÓN PURA ---
    
    // 8. Calcular el ángulo de rotación basado en la posición del mouse
    // atan2 da el ángulo del mouse respecto al centro
    // Invertimos para que la luz vaya en dirección opuesta
    // float mouseAngle = atan(-uMouse.y, -uMouse.x);
    
   float mouseAngle = uMouseMagnitude;
    
   // float mouseAngle = atan(-uMouse.y, -uMouse.x ) uMouseMagnitude  * -1.5;
    // 9. Ángulo base (sin mouse = luz en top/bottom = PI/2)
    float baseAngle = 3.14159 ;
    
    // 10. Interpolar entre ángulo base y ángulo del mouse según magnitud
    // Cuando uMouseMagnitude = 0, usamos baseAngle (top/bottom)
    // Cuando uMouseMagnitude = 1, usamos mouseAngle (dirección opuesta al mouse)
    float rotationAngle = mix(baseAngle, mouseAngle, uMouseMagnitude / 2.5) ;
    
    // 11. Crear matriz de rotación
    float cosA = cos(rotationAngle) * 1.5;
    float sinA = sin(rotationAngle) * 0.5;
    mat2 rotation = mat2(cosA, -sinA, sinA, cosA);
    
    // 12. Rotar las coordenadas para la máscara direccional
    vec2 rotatedP = rotation * p ;
    
    // 13. Calcular q con las coordenadas rotadas
    vec2 qRotated = abs(rotatedP) - boxSize + vec2(shapeRadius);
    
    // 14. Máscara direccional (ahora está rotada)
    float transitionSoftness = 1.0;
    float directionMask = smoothstep(-transitionSoftness, transitionSoftness, qRotated.y - qRotated.x);
    
    // Aplicamos la máscara
    fresnelFactor *= directionMask;
    
    
    // 15. Resultado final
    float finalIntensity = fresnelFactor * alphaMask;

    vec3 finalColor = uOutlineColor * finalIntensity * uOutlineStrength;
    
    gl_FragColor = vec4(finalColor, finalIntensity);
}
