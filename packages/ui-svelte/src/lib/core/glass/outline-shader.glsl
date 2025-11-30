uniform sampler2D tNormal;
uniform vec2 uResolution;
uniform float uOutlineStrength;
uniform vec3 uOutlineColor;
uniform float uFresnelPower;
uniform float uBorderRadius; 
uniform vec2 uBoxNormalizedSize; 
uniform float uDpr;

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

    // Tamaño Inset
    vec2 boxSize = vec2(uBoxNormalizedSize.x, 1.0);
    
    // Radio para la FORMA (Geometría)
    // Este lo dejamos igual para que coincida con el border-radius de tu CSS
    float shapeRadius = uBorderRadius * min(boxSize.x, boxSize.y);
    
    // Distancia SDF
    float dist = sdRoundedBox(p, boxSize, vec4(shapeRadius));
    
    
    // --- CAMBIO CLAVE: ANCHURA CONSTANTE ---
    
    // Definimos qué tan grueso queremos el borde del Fresnel.
    // 0.15 significa "15% de la altura del viewport", constante para todos.
    // Puedes convertir esto en un uniform uFresnelWidth si quieres controlarlo desde JS.
       float targetPixelWidth = 2.0; 
    
    // 2. Conversión de Píxeles a Espacio SDF
    // El espacio SDF vertical mide 2.0 unidades (-1 a 1).
    // uResolution.y es la altura en píxeles físicos.
    // Multiplicamos por uDpr para asegurar que 40px se vean igual en pantallas Retina.
    float pixelToSdfScale = 3.0 / uResolution.y;
    
    float fresnelWidth = (targetPixelWidth * uDpr) * pixelToSdfScale;
    
    float curveFactor = smoothstep(-fresnelWidth, 0.0, dist);
    // --- FRESNEL VIRTUAL ---
    // Mismo cálculo que antes
    float virtualNdotV = physicalNdotV * (1.0 - pow(curveFactor, 2.0)); // Subí a 3.0 para hacerlo más "sharp" en el borde
    
    float fresnelFactor = pow(1.0 - virtualNdotV, uFresnelPower);

    // --- MÁSCARA ---
    float alphaMask = 1.0 - smoothstep(0.0, 0.01, dist);
    
    float finalIntensity = fresnelFactor * alphaMask;

    vec3 finalColor = uOutlineColor * finalIntensity * uOutlineStrength;
    
    gl_FragColor = vec4(finalColor, finalIntensity);
}
