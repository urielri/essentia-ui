// ──────────────────────────────────────────────────────────────
// Liquid Glass — Fase 3
//
// Pipeline:
//   1. La escena de fondo se captura a u_background antes de este draw call
//   2. Se distorsionan las coordenadas de pantalla según IOR
//   3. Se aplica aberración cromática, tinte y Fresnel
// ──────────────────────────────────────────────────────────────

// Fondo capturado (WebGLRenderTarget de la escena sin este objeto)
uniform sampler2D u_background;

// Métricas del viewport — en píxeles
uniform vec2 u_resolution;

// Geometría del elemento (mismos roles que en sdf-rect)
uniform vec2 u_size;
uniform float u_radius;
uniform float u_softness;

// Óptica
// u_ior:         Índice de refracción. 1.0 = sin distorsión, 1.5 = vidrio estándar
// u_distortion:  Multiplicador de la intensidad total de distorsión
uniform float u_ior;
uniform float u_distortion;

// Aberración cromática: desplazamiento relativo entre canales R y B
// 0.0 = sin aberración, 0.03 = efecto notable
uniform float u_chromatic_aberration;

// Tinte RGBA sobre el fondo refractado
uniform vec4 u_tint;

varying vec2 v_uv;

// Inigo Quilez — SDF rounded box
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  // ── 1. Shape masking via SDF ──────────────────────────────────
  vec2 p = (v_uv - 0.5) * u_size;
  float d = sdRoundedBox(p, u_size * 0.5, u_radius);
  float alpha = 1.0 - smoothstep(-u_softness, u_softness, d);

  // Early exit para píxeles completamente transparentes
  if (alpha < 0.001) discard;

  // ── 2. Screen-space UV ────────────────────────────────────────
  // gl_FragCoord en píxeles desde bottom-left, igual que el RenderTarget
  vec2 screenUV = gl_FragCoord.xy / u_resolution;

  // ── 3. Refracción lens-based ──────────────────────────────────
  // toCenter: vector desde el centro del glass hasta el fragmento, normalizado a [-0.5, 0.5]
  // Con cámara ortográfica 1:1 este vector es equivalente al ángulo de incidencia simplificado
  vec2 toCenter = v_uv - 0.5;

  // Distorsión proporcional a (IOR - 1.0): sin refracción si IOR = 1.0
  // El signo negativo hace que el glass actúe como lente convergente (vidrio convexo)
  vec2 refractOffset = -toCenter * (u_ior - 1.0) * u_distortion;

  // ── 4. Aberración cromática ───────────────────────────────────
  // R se desplaza en la dirección de refracción, B en sentido opuesto
  // Simula la dispersión del espectro que ocurre en vidrio real
  float ca = u_chromatic_aberration;
  float r = texture2D(u_background, screenUV + refractOffset * (1.0 + ca)).r;
  float g = texture2D(u_background, screenUV + refractOffset).g;
  float b = texture2D(u_background, screenUV + refractOffset * (1.0 - ca)).b;

  vec3 refracted = vec3(r, g, b);

  // ── 5. Tinte ──────────────────────────────────────────────────
  refracted = mix(refracted, u_tint.rgb, u_tint.a);

  // ── 6. Fresnel edge ───────────────────────────────────────────
  // Borde ligeramente más brillante: simula la reflexión especular en ángulos oblicuos
  // Se calcula como función de la distancia al borde del SDF
  float edgeProximity = 1.0 - smoothstep(0.0, 8.0, -d);
  refracted += edgeProximity * 0.06;

  gl_FragColor = vec4(refracted, alpha);
}
