uniform float uTime;

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
