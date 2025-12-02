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

// Simple hash / gradient noise (2D) adapted from earlier implementation
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float smoothInterp(float x) {
    return x * x * (3.0 - 2.0 * x);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 a = hash2(i + vec2(0.0, 0.0));
    vec2 b = hash2(i + vec2(1.0, 0.0));
    vec2 c = hash2(i + vec2(0.0, 1.0));
    vec2 d = hash2(i + vec2(1.0, 1.0));

    float va = dot(a, f - vec2(0.0));
    float vb = dot(b, f - vec2(1.0, 0.0));
    float vc = dot(c, f - vec2(0.0, 1.0));
    float vd = dot(d, f - vec2(1.0, 1.0));

    float ix0 = mix(va, vb, smoothInterp(f.x));
    float ix1 = mix(vc, vd, smoothInterp(f.x));
    return mix(ix0, ix1, smoothInterp(f.y));
}

// FBM: multi-octave noise using noise2 (time enters as the third dimension via offsets)
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    vec2 shift = vec2(12.9898,78.233);
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise2(p.xy * pow(2.0, float(i)) + p.z);
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    // Screen UV in [0,1]
    vec2 screenUV = vCoord.xy / vCoord.w;
    screenUV = screenUV * 0.5 + 0.5;

    // 1) Basic refraction
    vec3 viewDirection = normalize(-vNormal);
    vec3 refractedRay = refract(viewDirection, vNormal, uRefractionRatio);

    vec2 geoOffset = refractedRay.xy * 0.708;
    geoOffset.x /= max(uScale.x, 1e-6);
    geoOffset.y /= max(uScale.y, 1e-6);

    // 2) Fresnel factor for edge mask
    vec3 fresnelViewDirection = normalize(uCameraPos - vWorldPosition);
    float f = 1.0 - abs(dot(fresnelViewDirection, vNormal));
    float fresnelFactor = pow(f, 0.3);

    // Edge mask based on UV distance from center
    vec2 centerUV = vUv - vec2(0.5);
    float distanceFromCenter = length(centerUV);
    float borderMask = pow(distanceFromCenter, 3.0);

    // 3) Complex distortion: FBM-driven flow field (angle-based)
    float timeFactor = uTime * 0.1;
    float fbmScale = 1.0;

    float n1 = fbm(vec3(screenUV * fbmScale, timeFactor));
    float n2 = fbm(vec3(screenUV * fbmScale * 2.5 + vec2(5.2), timeFactor * 0.1));

    // Build a direction from the noise (angle) and modulate magnitude by another fbm
    float angle = n2 * 6.28318530718; // 2*pi
    vec2 dir = vec2(cos(angle), sin(angle));

    // Magnitude modulation uses n1 and mouse influence for interactive response
    float magnitude = (n1 * 0.7 + 0.3) * (0.5 + uMouseMagnitude * 0.7);
    vec2 fbmOffset = dir * magnitude * 1.15; // tune global strength

    // Strengthen offset at edges using fresnelFactor
    vec2 edgeDistortion = fbmOffset * pow(fresnelFactor, 2.0) * 0.9;

    // 4) Final displacement and sample
    vec2 totalOffset = geoOffset + edgeDistortion;
    vec2 finalOffset = totalOffset * uDistortion;
    vec2 refractedUV = screenUV + finalOffset;

    vec4 color = texture2D(tBackground, refractedUV);

    // 5) Final composition: subtle Fresnel highlight and opacity by border
    float fresnelShine = fresnelFactor * 0.45;
    const float MIN_OPACITY = 0.1;
    const float MAX_OPACITY = 1.0;
    float glassOpacity = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * borderMask;

    vec3 finalColor = mix(color.rgb, vec3(1.0), fresnelShine);
    gl_FragColor = vec4(finalColor, glassOpacity);
}
