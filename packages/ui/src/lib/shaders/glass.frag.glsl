// ──────────────────────────────────────────────────────────────
// Liquid Glass — Fase 3 + Environment Map
//
// Pipeline:
//   1. Captura de fondo → u_background (RenderTarget)
//   2. Distorsión IOR + aberración cromática
//   3. Reflejo de entorno (equirectangular EXR) sobre superficie virtual
//   4. Tinte, Fresnel, shape masking SDF
// ──────────────────────────────────────────────────────────────

#define PI 3.14159265359

// Fondo capturado (WebGLRenderTarget de la escena sin este objeto)
uniform sampler2D u_background;

// Métricas del viewport — en píxeles
uniform vec2 u_resolution;

// Geometría del elemento
uniform vec2 u_size;
uniform float u_radius;
uniform float u_softness;

// Óptica de refracción
uniform float u_ior;
uniform float u_distortion;
uniform float u_chromatic_aberration;

// Blur (frosted glass). 0 = sin blur. Valor en píxeles de radio de kernel.
uniform float u_blur;

// Tinte RGBA sobre el fondo refractado
uniform vec4 u_tint;

// Fresnel: brillo en los bordes del glass
uniform float u_fresnel_strength;

// Environment map equirectangular (EXR)
// u_env_intensity = 0.0 → env map desactivado (fallback sin textura)
uniform sampler2D u_env_map;
uniform float u_env_intensity;

varying vec2 v_uv;

// Inigo Quilez — SDF rounded box
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Kernel Gaussiano 3×3 sobre u_background.
// px = u_blur / u_resolution (spread por pixel). Con px=(0,0) → resultado = muestra única.
vec3 sampleBackground(vec2 uv) {
  vec2 px = u_blur / u_resolution;
  vec3 c = vec3(0.0);
  c += texture2D(u_background, uv + vec2(-1.0,-1.0)*px).rgb * 0.0625;
  c += texture2D(u_background, uv + vec2( 0.0,-1.0)*px).rgb * 0.125;
  c += texture2D(u_background, uv + vec2( 1.0,-1.0)*px).rgb * 0.0625;
  c += texture2D(u_background, uv + vec2(-1.0, 0.0)*px).rgb * 0.125;
  c += texture2D(u_background, uv + vec2( 0.0, 0.0)*px).rgb * 0.25;
  c += texture2D(u_background, uv + vec2( 1.0, 0.0)*px).rgb * 0.125;
  c += texture2D(u_background, uv + vec2(-1.0, 1.0)*px).rgb * 0.0625;
  c += texture2D(u_background, uv + vec2( 0.0, 1.0)*px).rgb * 0.125;
  c += texture2D(u_background, uv + vec2( 1.0, 1.0)*px).rgb * 0.0625;
  return c;
}

// Muestrea un env map equirectangular dado un vector de dirección 3D
vec3 sampleEnvMap(vec3 dir) {
  float phi   = atan(dir.z, dir.x);                   // [-PI, PI]
  float theta = asin(clamp(dir.y, -1.0, 1.0));        // [-PI/2, PI/2]
  vec2 uv = vec2(
    0.5 + phi   / (2.0 * PI),
    0.5 + theta / PI
  );
  return texture2D(u_env_map, uv).rgb;
}

void main() {
  // ── 1. Shape masking via SDF ──────────────────────────────────
  vec2 p = (v_uv - 0.5) * u_size;
  float d = sdRoundedBox(p, u_size * 0.5, u_radius);
  // fwidth(d): tasa de cambio del SDF por píxel físico → AA exactamente 1px, DPR-aware.
  // u_softness añade suavidad extra opcional (default 0 = bordes nítidos).
  float aa = fwidth(d) + u_softness;
  float alpha = 1.0 - smoothstep(-aa, aa, d);
  if (alpha < 0.001) discard;

  // ── 2. Screen-space UV ────────────────────────────────────────
  vec2 screenUV = gl_FragCoord.xy / u_resolution;
  vec2 toCenter = v_uv - 0.5;

  // ── 3. Refracción lens-based ──────────────────────────────────
  // Signo positivo: lente divergente — los bordes samplea hacia afuera.
  // Efecto visual: el contenido detrás aparece ligeramente expandido/distorsionado
  // sin inversión de imagen, como un vidrio grueso real.
  vec2 refractOffset = toCenter * (u_ior - 1.0) * u_distortion;

  // ── 4. Aberración cromática + blur ───────────────────────────
  float ca = u_chromatic_aberration;
  float r = sampleBackground(screenUV + refractOffset * (1.0 + ca)).r;
  float g = sampleBackground(screenUV + refractOffset).g;
  float b = sampleBackground(screenUV + refractOffset * (1.0 - ca)).b;
  vec3 refracted = vec3(r, g, b);

  // ── 5. Reflejo del entorno (IBL) ──────────────────────────────
  // Normal virtual: la superficie del glass se trata como ligeramente convexa.
  // toCenter desplaza el normal hacia los bordes → el centro refleja el cénit,
  // los bordes reflejan el horizonte del env map.
  // curvature controla cuán pronunciada es la "lente" virtual.
  float curvature = 0.6;
  vec3 virtualNormal = normalize(vec3(-toCenter.x * curvature, toCenter.y * curvature, 1.0));

  // Cámara ortográfica mira en -Z → reflect da la dirección de reflejo
  vec3 viewDir = vec3(0.0, 0.0, -1.0);
  vec3 reflDir = reflect(viewDir, virtualNormal);

  vec3 envColor = sampleEnvMap(reflDir);

  // El env map se mezcla sobre el color refractado
  // u_env_intensity controla la contribución; 0 = sin efecto
  refracted = mix(refracted, refracted + envColor, u_env_intensity * 0.5);

  // ── 6. Tinte ──────────────────────────────────────────────────
  refracted = mix(refracted, u_tint.rgb, u_tint.a);

  // ── 7. Fresnel edge ───────────────────────────────────────────
  float edgeProximity = 1.0 - smoothstep(0.0, 8.0, -d);
  refracted += edgeProximity * u_fresnel_strength;

  gl_FragColor = vec4(refracted, alpha);
}
