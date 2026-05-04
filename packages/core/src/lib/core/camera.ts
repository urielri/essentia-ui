import { OrthographicCamera } from 'three'

/**
 * Crea una cámara ortográfica con mapping 1:1 píxel/unidad.
 * El origen (0,0) queda en el centro del viewport.
 * Z positivo apunta hacia la cámara (hacia el observador).
 */
export function createOrthographicCamera(width: number, height: number): OrthographicCamera {
  const camera = new OrthographicCamera(
    -width / 2,  // left
    width / 2,   // right
    height / 2,  // top
    -height / 2, // bottom
    0.1,         // near
    1000,        // far
  )
  camera.position.z = 100
  return camera
}

/**
 * Actualiza el frustum de la cámara ante un cambio de viewport.
 * Debe llamarse siempre con updateProjectionMatrix().
 */
export function updateCameraFrustum(
  camera: OrthographicCamera,
  width: number,
  height: number,
): void {
  camera.left = -width / 2
  camera.right = width / 2
  camera.top = height / 2
  camera.bottom = -height / 2
  camera.updateProjectionMatrix()
}

/**
 * Convierte coordenadas de mundo (Three.js) a coordenadas de pantalla (CSS).
 * Origen de pantalla: esquina superior izquierda.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: { width: number; height: number },
): { x: number; y: number } {
  return {
    x: worldX + viewport.width / 2,
    y: viewport.height / 2 - worldY,
  }
}

/**
 * Convierte coordenadas de pantalla (CSS) a coordenadas de mundo (Three.js).
 * Origen de mundo: centro del viewport.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: { width: number; height: number },
): { x: number; y: number } {
  return {
    x: screenX - viewport.width / 2,
    y: viewport.height / 2 - screenY,
  }
}
