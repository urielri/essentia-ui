uniform sampler2D tNormal;
uniform vec2 uResolution;
uniform float uOutlineStrength;
uniform vec3 uOutlineColor;
uniform float uFresnelPower;
uniform float uBorderRadius; 
uniform vec2 uBoxNormalizedSize; 

varying vec2 vUv;

float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

void main() {
    vec4 normalSample = texture2D(tNormal, vUv);
    
 // DEBUG: Visualiza el canal alfa de la textura de normales
    // Descomenta esta línea para ver si hay contenido:
    // gl_FragColor = vec4(vec3(normalSample.a), 1.0); return;

    if (normalSample.a < 0.01) {
        discard;
    }
    
    // Decodificar normales
    vec3 viewNormal = normalize(normalSample.rgb * 2.0 - 1.0);
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    
   // DEBUG: Visualiza las normales decodificadas
    // Descomenta esta línea para ver las normales:
    // gl_FragColor = vec4(viewNormal * 0.5 + 0.5, 1.0); return;
    

    // Calcular Fresnel
    float NdotV = abs(dot(viewNormal, viewDir));
    float fresnelFactor = pow(1.0 - NdotV, uFresnelPower);

 // DEBUG: Visualiza el fresnel
    // Descomenta esta línea para ver el fresnel:
    // gl_FragColor = vec4(vec3(fresnelFactor), 1.0); return;
    
    // SDF para definir la región del borde
    vec2 p = vUv * 2.0 - 1.0;

    // DEBUG: Visualiza las coordenadas
    // Descomenta para ver si las coordenadas están bien:
    // gl_FragColor = vec4(vUv, 0.0, 1.0); return;
    
    float viewportAspect = uResolution.x / uResolution.y;
    float boxAspect = uBoxNormalizedSize.x / uBoxNormalizedSize.y;
    
    vec2 scaledP = p;
    scaledP.x *= viewportAspect / boxAspect;
    
    vec2 boxSize = vec2(1.0, 1.0);
    float adjustedRadius = uBorderRadius * min(uBoxNormalizedSize.x, uBoxNormalizedSize.y);
    
    float dist = sdRoundedBox(scaledP, boxSize, vec4(adjustedRadius));
    
 // DEBUG: Visualiza la distancia SDF
    // Descomenta para ver el campo de distancia:
    // gl_FragColor = vec4(vec3(dist * 0.5 + 0.5), 1.0); return;
    

    // Máscara: solo el borde (grosor ajustable)
    float innerEdge = -0.05;  // Ajusta este valor para hacer el borde más grueso
    float outerEdge = 0.05;
    float sdfMask = 1.0 - smoothstep(innerEdge, outerEdge, dist);
    
    // Combinar Fresnel con SDF
    // El SDF define DÓNDE aparece el borde
    // El Fresnel define la INTENSIDAD basada en el ángulo de visión
    float finalIntensity = fresnelFactor * sdfMask;
    
    // DEBUG: Visualiza la intensidad final antes de aplicar color
    // Descomenta para ver la intensidad combinada:
    // gl_FragColor = vec4(vec3(finalIntensity), 1.0); return;
    
    vec3 finalColor = uOutlineColor * finalIntensity * uOutlineStrength;
    
    gl_FragColor = vec4(finalColor, finalIntensity);
}
   //gl_FragColor = vec4(normalSample.rgb, 1.0); return; 
