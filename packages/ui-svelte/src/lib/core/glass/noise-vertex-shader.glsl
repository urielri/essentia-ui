// ----------------------------------------------------
// 1. UNIFORMS & ATTRIBUTES (Entradas desde JS)
// ----------------------------------------------------
uniform float u_time;
uniform float perlinFactor;
uniform float randomFactor;
uniform float width3D;
uniform float height3D;
uniform vec2 mouse; // Posición del mouse normalizada [-1, 1]
uniform float mouseMagnitude;

attribute vec2 reference; // Semilla de ruido aleatorio por partícula
varying float perlin; // Pasamos el valor de ruido al Fragment Shader


vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
}

// ----------------------------------------------------
// 3. MAIN (Lógica de Partículas)
// ----------------------------------------------------
void main() {
    // 1. Desplazamiento Aleatorio Inicial (usando 'reference' attribute)
    float rF = randomFactor;
    vec3 randomOffset = vec3(
        random(reference.xy), 
        random(reference.yx * vec2(3.0)), 
        random(reference.xy * vec2(5.0))
    ) * rF * 0.1; // Multiplicar por 0.1 para que el randomOffset no sea demasiado grande
    
    vec3 tweakedPos = position + randomOffset;
    
    // 2. Cálculo del Ruido de Perlin (cnoise 3D)
    
    // Escala de la posición para el ruido. Usa un valor base (ej. 3.0) para la densidad.
    vec3 noiseScale = vec3(3.0 * width3D, 3.0 * height3D, 3.0);
    vec3 noisePos = tweakedPos / noiseScale;
    
    // Animación temporal del ruido
    /*
    vec3 noiseAnimation = vec3(
        sin(u_time/2.7), 
        cos(u_time/3.6), 
        sin(u_time/5.5)
    );
    */
    vec3 noiseAnimation = vec3(0.0, 0.0, 0.0);
    
    // cnoise está entre -1 y 1. Lo ajustamos a 0 y 2.
    perlin = cnoise(
        noisePos * (perlinFactor + sin(u_time/8.0)) + noiseAnimation * 0.3
    ) + 1.0; 
    
    // 3. Aplicar Desplazamiento de Perlin (Deformación 3D)
    float displacementIntensity = 1.8; // Controla qué tan fuerte empuja el ruido
    
    // Deformación simple a lo largo de Z (creando profundidad de nube)
    tweakedPos.z += perlin * displacementIntensity; 
    
    // 4. Interacción con el Mouse (Atracción/Repulsión)
    
  vec2 normalizedPos = tweakedPos.xy / vec2(width3D, height3D);
    
    float dist = distance(normalizedPos, mouse);
    
    // El mouse solo influye en un radio pequeño (0.3)
    float mouseInfluence = 1.0 - smoothstep(0.0, 0.3, dist); 
    
    // Aplicar el efecto (las partículas se repelen o atraen del mouse)
    // Se ha corregido la referencia al vec3, usando normalizedPos.xy y z=0.0
    vec3 mouseDir = normalize(vec3(mouse.x, mouse.y, 0.0) - vec3(normalizedPos.xy, 0.0));
    
    // Multiplicar por mouseMagnitude para controlar la intensidad desde JS
    tweakedPos.xy += mouseDir.xy * mouseInfluence * mouseMagnitude * 1.1;
    // 5. Salida Final
    vec4 mvPosition = modelViewMatrix * vec4(tweakedPos, 1.0);

    // Tamaño del punto: más grande donde el ruido es más alto
    // smoothstep(0.0, 2.0, perlin) asegura que el tamaño escala de forma suave.
    gl_PointSize = smoothstep(0.0, 2.0, perlin) * 5.0; // 5.0 es el tamaño base

    gl_Position = projectionMatrix * mvPosition;
}
