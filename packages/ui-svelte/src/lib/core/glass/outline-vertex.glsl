varying vec2 vUv;

void main() {
    vUv = uv;
    
    // Proyección directa a screen space para el quad fullscreen
    gl_Position = vec4(position, 1.0);
}
/*
varying vec3 vNormal;
varying vec4 vCoord;
varying vec3 vWorldPosition; 
varying vec2 vUv;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz; 

    vCoord = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vNormal = normalize(normalMatrix * normal);
    vUv = uv;

    gl_Position = vCoord;
}
*/
