/**
 * Configuración para cargar un environment map equirectangular (HDR/EXR/img)
 * vía `<Environment/>` de @threlte/extras. Alternativa de más alto nivel a
 * pasar una `Texture` ya construida vía el prop `envMap` de EssentiaRoot.
 */
export type EnvironmentOptions = {
  /** URL del archivo .hdr / .exr / imagen estándar. */
  url: string
  /**
   * Si true, asigna la textura cargada como `scene.background`. Sobrescribe
   * el prop `background` de EssentiaRoot mientras esté montado.
   * @default false
   */
  isBackground?: boolean
}
