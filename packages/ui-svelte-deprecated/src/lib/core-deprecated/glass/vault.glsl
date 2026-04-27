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
varying vec2 vUv;
uniform vec3 uBaseColor; // Color base para teñir el ruido

// ----------------------------------------------------
// 2. FUNCIONES DE RUIDO PROCEDURAL (Simplex/Clásico)
// ----------------------------------------------------

// Función hash para generar coordenadas aleatorias coherentes (ajusta según la implementación)
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

// Interpola entre dos valores (suavizado)
float interpolate(float a, float b, float x) {
    float f = x * x * (3.0 - 2.0 * x); // Función 'smoothstep'
    return a + (b - a) * f;
}

// Función principal de ruido (2D Clásico)
float noise(vec2 p) {
    // Coordenadas de la cuadrícula
    vec2 i = floor(p);
    vec2 f = fract(p); // Posición dentro de la celda [0, 1]

    // Generar 4 valores de esquina aleatorios/gradientes coherentes
    float a = dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    // Interpolar los valores en X y luego en Y
    float ix = interpolate(a, b, f.x);
    float iy = interpolate(c, d, f.x);

    // El ruido final está en el rango [0, 1]
    return interpolate(ix, iy, f.y);
}

float calculateBorderMask(vec3 viewDirection, vec3 normal) {
    // Calcula la intensidad del borde (Fresnel)
    float f = 1.0 - abs(dot(viewDirection, normal));

    // Enfoca la máscara
    return pow(f, 6.0);
}

// Este es un efecto que devuelve un color.
vec3 applySepiaTone(vec3 color) {
    // Lógica para desaturar y teñir
    float avg = (color.r + color.g + color.b) / 3.0;
    vec3 sepia = vec3(avg * 1.0, avg * 0.9, avg * 0.7);
    return mix(color, sepia, 0.1); // Mezcla con el tono sepia
}

void main() {
    vec2 p = vUv * uScale.xy + uTime * 0.1;

    // 2. Generar Ruido
    float noiseValue = noise(p);

    // Opcional: Aplicar Octavas (sumar varias frecuencias para más complejidad, estilo Perlin)
     noiseValue += 0.5 * noise(p * 0.8); // Una octava más pequeña y débil (p * 2.0 original)
     // noiseValue /= 1.5; // Normalizar

    // 3. Aplicar Color y Salida

    // Tinte: Mezclamos el color base (uBaseColor) con el valor de ruido
    // Esto crea un degradado de oscuro a claro basado en el valor de ruido.
    vec3 finalColor = uBaseColor * noiseValue;

    // Salida final con opacidad 1.0
    gl_FragColor = vec4(finalColor, 0.3);
}
