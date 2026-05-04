uniform sampler2D u_texture;
uniform vec2 u_size;
uniform float u_radius;
uniform float u_softness;
uniform float u_opacity;

varying vec2 v_uv;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (v_uv - 0.5) * u_size;
  float d = sdRoundedBox(p, u_size * 0.5, u_radius);
  float alpha = 1.0 - smoothstep(-u_softness, u_softness, d);

  vec4 tex = texture2D(u_texture, v_uv);
  gl_FragColor = vec4(tex.rgb, tex.a * u_opacity * alpha);
}
