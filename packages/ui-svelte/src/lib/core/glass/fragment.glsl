uniform sampler2D tBackground;
uniform float uTime;
uniform float uDistortion;
uniform float uRefractionRatio;
uniform vec3 uCameraPos;
uniform vec3 uScale;
uniform float uMouseMagnitude;
varying vec3 vNormal;
varying vec4 vCoord;
varying vec3 vWorldPosition;

void main() {
    vec2 screenUV = vCoord.xy / vCoord.w;
    screenUV = screenUV * 0.5 + 0.5;

    vec3 viewDirection = normalize(-vNormal); 
    vec3 refractedRay = refract(viewDirection, vNormal, uRefractionRatio);

    // Movimiento líquido muy sutil
    vec2 geoOffset = refractedRay.xy * 0.008; 
    geoOffset.x /= uScale.x;
    geoOffset.y /= uScale.y;

    vec2 liquidPattern = vNormal.xy * screenUV * uMouseMagnitude * 6.2; 
 
    // Usamos seno/coseno en el patrón para crear la forma de onda
    vec2 liquidOffset = vec2(
        sin(liquidPattern.y * 20.0 *  -1.0) * 0.003, // Aumenta la frecuencia de onda
        cos(liquidPattern.x * 15.0 *  1.0) * 0.003
    );

    // Efecto Fresnel
    vec3 fresnelViewDirection = normalize(uCameraPos - vWorldPosition); 
    float f = 1.0 - abs(dot(fresnelViewDirection, vNormal)); 
    float fresnelFactor = pow(f, 6.0); 

    // DISTORSIÓN DEL BORDE (Edge Distortion)
    
    // a) Crear un patrón de ruido (usando screenUV y uTime si quieres que se mueva)
    // Usaremos un patrón estático por ahora (sin uTime).
    // float noiseValue = sin(screenUV.x * 50.0) + cos(screenUV.y * 30.0);
    float noiseValue = sin(screenUV.x * 90.0 + uTime * 0.5) + cos(screenUV.y * 90.0 + uTime * 0.5);
    // b) Definir el desplazamiento máximo
    vec2 maxEdgeOffset = vec2(noiseValue) * 0.09; // Máximo 1% de distorsión
   float fresnelFactor2 = pow(f, 2.0);
    // c) Enmascarar y amplificar: Solo se activa donde el fresnelFactor es alto
    vec2 edgeDistortion = maxEdgeOffset * pow(fresnelFactor2, 2.0) * 1.5; 
    // Usamos pow(fresnelFactor, 2.0) para enfocar aún más la activación del borde

    // 6. CÁLCULO DE DESPLAZAMIENTO FINAL
    vec2 totalOffset = geoOffset + liquidOffset + edgeDistortion; // 🟢 Sumar el nuevo offset
    vec2 finalOffset = totalOffset * uDistortion;
    vec2 refractedUV = screenUV + finalOffset;

    vec4 color = texture2D(tBackground, refractedUV);

    // 6. 🔴 BORDE REAL DINÁMICO (Rim Lighting Focalizado)
    // Calcular el producto punto (dot) entre la normal y la vista.
    // Cuanto más cerca esté este valor de 1.0, más directa es la vista a la normal (centro de la cara).
    // Cuanto más cerca esté de 0.0, más de lado estamos.
    float rimFactorRaw = dot(fresnelViewDirection, vNormal);

    // Invertir (para que 1.0 esté en el borde) y elevar a una potencia muy alta (e.g., 20.0)
    // Esto crea un punto de luz muy pequeño y focalizado que se mueve
    float rimFactor = pow(1.0 - rimFactorRaw, 4.4);

    // 7. APLICACIÓN DEL BRILO COMBINADO
    float fresnelShine = fresnelFactor * 0.5; 
    float rimShine = rimFactor * 60.0;
    // El brillo total es el Fresnel general más el rim lighting dinámico
    // float finalShine = fresnelFactor * 0.7 + rimFactor * 19.2; // Multiplicar por 5.0 para que se note
    float totalShine = fresnelShine + rimShine; 

    // 7. 🔴 ENMASCARAR CON LA MAGNITUD DEL MOUSE
    // Si uMouseMagnitude es 0 (mouse en centro), finalShine es 0.
    // Si uMouseMagnitude es 1 (mouse en esquina), finalShine usa el valor completo.
    float finalShine = totalShine * uMouseMagnitude;
    // Aumentar el brillo (mezcla con blanco)
    // finalShine se ajusta con 'clamp' implícito si usas vec3(1.0)
    vec3 finalColor = mix(color.rgb, vec3(1.0), finalShine); 


    // 8. Color Final
    float glassOpacity = 1.0;
    gl_FragColor = vec4(finalColor, color.a * glassOpacity);}
