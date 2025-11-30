varying float vAlpha;
uniform vec3 uBaseColor;

void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    
    // Círculo un poco más definido para que parezca grano
    float shape = 1.0 - smoothstep(0.35, 0.5, r);
    
    if (shape < 0.01) discard;
    
    // Opacidad Ajustada para NormalBlending
    // Subimos de 0.1 a 0.4 porque ya no se suman exponencialmente
    float opacity = shape * vAlpha * 0.1; 
    
    gl_FragColor = vec4(uBaseColor, opacity);
}
