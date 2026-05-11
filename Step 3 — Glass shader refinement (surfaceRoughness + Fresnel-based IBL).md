# Step 3 — Glass shader refinement
## Objetivo
Reemplazar el hack `curvature` por un parámetro físicamente plausible `surfaceRoughness` que perturbe el normal vía ruido procedural. Convertir el IBL de aditivo a mezcla vía Fresnel-Schlick. Exponer props en `<Glass>` y tunear defaults para que demos existentes sigan viéndose bien.
## Estado actual
El Glass implementa:
* Refracción lens-based con `curvature: 0.6` (valor hardcodeado en el shader, línea 111 de glass.frag.glsl)
* IBL aditivo: `mix(refracted, refracted + envColor, u_env_intensity * 0.5)` (línea 122)
* SDF rounded corners, blur, aberración cromática, Fresnel edge glow
## Cambios necesarios
### 1. glass.frag.glsl
**Reemplazar curvature hardcodeado por surfaceRoughness:**
* Agregar `uniform float u_surface_roughness` (rango [0..1])
* Generador de ruido 2D procedural sutilizado por `u_surface_roughness` → perturba `virtualNormal`
* Centro del panel: normal casi vertical (Z cercano a 1). Bordes: desviación suave hacia los extremos.
* Fresnel-Schlick para mezcla IBL:
    * F0 = 0.04 (vidrio)
    * Calcular Fresnel(viewDir, virtualNormal)
    * Centro (Fresnel bajo): muestra refracción pura
    * Bordes (Fresnel alto): reflejo dominante
### 2. glass.uniforms.ts
* Agregar `u_surface_roughness: IUniform<number>` con default 0
* Actualizar `GlassUniformsParams` e `createGlassUniforms`
### 3. glass-node.ts
* Agregar `surfaceRoughness?: number` a `GlassNodeOptions`
* Método `setSurfaceRoughness(roughness: number): this`
### 4. glass.svelte
* Prop `surfaceRoughness?: number` (default 0)
* Llamar `node.setSurfaceRoughness(surfaceRoughness)` en $effect de sync
### 5. glass-node.test.ts
* Test: setSurfaceRoughness actualiza u_surface_roughness
* Test: setFresnelStrength sigue funcionando (ya existe, verificar)
## Decisión: defaults
`surfaceRoughness: 0` → mantiene Glass actual (normal virtual sin perturbación, Fresnel-Schlick sin cambios visuales respecto a IBL aditivo con intensity bajo). Opt-in para mayores valores.
## Costo estimado
~3h (shader math, tupla de tests, tunear demos existentes)
## Demos a validar post-merge
* `/` (landing)
* `/product` (showcase)
* `/playground` (libre)
