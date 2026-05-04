/**
 * Espejo TypeScript de las funciones SDF implementadas en GLSL.
 * Permite testear la lógica de distancia sin ejecutar en GPU.
 *
 * Convenio de signos (igual que en shader):
 *   d < 0  →  punto dentro de la forma
 *   d = 0  →  punto sobre el borde exacto
 *   d > 0  →  punto fuera de la forma
 */

/**
 * SDF de rectángulo con esquinas redondeadas (Inigo Quilez).
 *
 * @param px  Coordenada X del punto, centrada en el origen del rect
 * @param py  Coordenada Y del punto, centrada en el origen del rect
 * @param halfW  Semiancho del rect en píxeles
 * @param halfH  Semialto del rect en píxeles
 * @param r  Radio de esquinas en píxeles
 */
export function sdRoundedBox(
  px: number,
  py: number,
  halfW: number,
  halfH: number,
  r: number,
): number {
  const qx = Math.abs(px) - halfW + r
  const qy = Math.abs(py) - halfH + r
  const outerLen = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2)
  const innerCorner = Math.min(Math.max(qx, qy), 0)
  return outerLen + innerCorner - r
}

/**
 * Alpha de anti-aliasing equivalente al smoothstep del fragment shader.
 *
 * @param d        Distancia SDF
 * @param softness Ancho del borde suavizado en píxeles (u_softness)
 */
export function sdfAlpha(d: number, softness: number): number {
  const t = (d + softness) / (2 * softness)
  const clamped = Math.max(0, Math.min(1, t))
  // smoothstep: 3t² - 2t³
  const smooth = clamped * clamped * (3 - 2 * clamped)
  return 1 - smooth
}
