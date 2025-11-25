uniform sampler2D tDepth; // Textura de profundidad capturada (del outlineRenderTarget)
uniform vec2 uResolution; // Resolución del viewport
uniform float uOutlineWidth; // Sensibilidad de la detección del borde
uniform float uOutlineStrength; // Intensidad del brillo del borde
uniform vec3 uOutlineColor; // Color del borde

// Control de fuerza individual
uniform float uLeftBorderStrength;
uniform float uRightBorderStrength;
uniform float uTopBorderStrength;
uniform float uBottomBorderStrength;

// Control de la anchura del desvanecimiento (Falloff)
uniform float uLeftBorderFalloff;
uniform float uRightBorderFalloff;
uniform float uTopBorderFalloff;
uniform float uBottomBorderFalloff;

// 🟢 NUEVO UNIFORM: Posición X normalizada del mouse (0.0 a 1.0)
uniform float uMouseXN; 

varying vec2 vUv;

void main() {
    // 1. Detección de Borde por Profundidad (Sobel)
    
    vec2 texelSize = 1.0 / uResolution;

    float depth = texture2D(tDepth, vUv).r; 
    
    // Muestreo
    float depthUp = texture2D(tDepth, vUv + vec2(0.0, texelSize.y)).r;
    float depthDown = texture2D(tDepth, vUv + vec2(0.0, -texelSize.y)).r;
    float depthLeft = texture2D(tDepth, vUv + vec2(-texelSize.x, 0.0)).r;
    float depthRight = texture2D(tDepth, vUv + vec2(texelSize.x, 0.0)).r;

    // Cálculo del gradiente
    float diffX = abs(depth - depthLeft) + abs(depth - depthRight);
    float diffY = abs(depth - depthUp) + abs(depth - depthDown);
    float edge = sqrt(diffX * diffX + diffY * diffY);

    // Máscara de detección
    float sensitivity = uOutlineWidth; 
    float borderMask = smoothstep(0.0, sensitivity, edge);
    borderMask = pow(borderMask, 2.0);
    
    // ----------------------------------------------------
    // 🟢 LÓGICA DE CONTROL Y FOCO
    // ----------------------------------------------------

    // === 1. Cálculos de Distancia al Centro (Atenuación de Vértices) ===
    // Distancia al Centro [1.0 (Centro) a 0.0 (Extremo)]
    float hDistToEdge = abs(vUv.x - 0.5) * 2.0;
    float vDistToEdge = abs(vUv.y - 0.5) * 2.0;

    float hDistToCenter = 1.0 - hDistToEdge; // Máx en centro, Mín en lados (para atenuar Top/Bottom)
    float vDistToCenter = 1.0 - vDistToEdge; // Máx en centro, Mín en Top/Bottom (para atenuar Left/Right)

    // === 2. Simulación de Border-Radius ===
    // Máscara que reduce la intensidad en las esquinas.
    const float CORNER_FADE_SIZE = 0.8; // Controla el tamaño del redondeo (0.0 a 1.0)
    
    float cornerFade = hDistToCenter * vDistToCenter; // Máx en centro total, Mín en esquinas

    // Suavizamos y aplicamos una curva (pow(..., 0.5)) para un aspecto más circular en las esquinas.
    float cornerRadiusMask = pow(smoothstep(0.0, CORNER_FADE_SIZE, cornerFade), 0.5);

    // === 3. Máscara de Foco (Sigue al Mouse en X) ===
    // Queremos que la intensidad sea máxima en la posición X del mouse (uMouseXN).
    const float FOCUS_WIDTH = 0.3; // Anchura del foco de luz

    float distFromFocusCenter = abs(vUv.x - uMouseXN);
    float focusStrength = 1.0 - (distFromFocusCenter / FOCUS_WIDTH); 

    // Perfil del pico de luz
    float focusMask = smoothstep(0.0, 1.0, focusStrength);
    focusMask = pow(focusMask, 10.0); 

    // === 4. Máscaras de Borde (Control de ubicación y Falloff) ===
    
    float leftEdge = smoothstep(uLeftBorderFalloff, 0.0, vUv.x);
    float rightEdge = smoothstep(1.0 - uRightBorderFalloff, 1.0, vUv.x);
    float bottomEdge = smoothstep(uBottomBorderFalloff, 0.0, vUv.y);
    float topEdge = smoothstep(1.0 - uTopBorderFalloff, 1.0, vUv.y);

    // === 5. Combinación Final (Fuerza * Atenuación * Foco * Radius) ===

    float combinedMask = 0.0;

    // Aplicamos el Foco Lateral y la Máscara de Radius a la fuerza base.
    float dynamicLeftStrength = uLeftBorderStrength * focusMask * cornerRadiusMask;
    float dynamicRightStrength = uRightBorderStrength * focusMask * cornerRadiusMask;

    // Borde Izquierdo: Multiplicado por la atenuación vertical (vDistToCenter)
    combinedMask = max(combinedMask, leftEdge * vDistToCenter * dynamicLeftStrength); 

    // Borde Derecho: Multiplicado por la atenuación vertical (vDistToCenter)
    combinedMask = max(combinedMask, rightEdge * vDistToCenter * dynamicRightStrength); 

    // Los bordes Top/Bottom también usan el Foco y el Radius
    float dynamicTopBottomStrength = uTopBorderStrength * focusMask * cornerRadiusMask;

    // Borde Inferior: Multiplicado por la atenuación horizontal (hDistToCenter)
    combinedMask = max(combinedMask, bottomEdge * hDistToCenter * dynamicTopBottomStrength);

    // Borde Superior: Multiplicado por la atenuación horizontal (hDistToCenter)
    combinedMask = max(combinedMask, topEdge * hDistToCenter * dynamicTopBottomStrength);

    // ----------------------------------------------------

    // Mantenemos la potencia en 1.0 para preservar la visibilidad del brillo
    combinedMask = pow(combinedMask, 1.0); 

    // Aplicar la Máscara Combinada al resultado de la Detección de Profundidad
    float finalMask = borderMask * combinedMask; 

    // Dibujar el brillo final
    vec3 finalOutline = uOutlineColor * finalMask * uOutlineStrength;

    gl_FragColor = vec4(finalOutline, finalMask); 
}
