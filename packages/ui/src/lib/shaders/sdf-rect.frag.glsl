// u_size:     widget size in pixels (matches mesh scale with ortho 1:1)
// u_radius:   corner radius in pixels — clamped in JS, graceful degradation in shader
// u_color:    rgba [0..1]
// u_softness: anti-aliasing width in pixels (tipicamente 1.0–2.0)

uniform vec2 u_size;
uniform float u_radius;
uniform vec4 u_color;
uniform float u_softness;

varying vec2 v_uv;

// Inigo Quilez — exact SDF for axis-aligned rounded rectangle
// p: evaluation point, centered at box origin
// b: half-extents of the box
// r: corner radius
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  // UV [0,1] → pixel coords centered at origin
  // Con cámara ortográfica 1:1, 1 unidad = 1 px → coordenadas en píxeles exactas
  vec2 p = (v_uv - 0.5) * u_size;

  float d = sdRoundedBox(p, u_size * 0.5, u_radius);

  // Borde suavizado: interior < 0, exterior > 0
  // smoothstep mapea [-softness, softness] → [1, 0]
  float alpha = 1.0 - smoothstep(-u_softness, u_softness, d);

  gl_FragColor = vec4(u_color.rgb, u_color.a * alpha);
}
