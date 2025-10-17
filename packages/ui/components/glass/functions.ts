import * as THREE from "three";
/**
 * Comprueba si el navegador soporta WebGL.
 * Three.js depende de WebGL para el renderizado 3D.
 */
export function isWebGLAvailable(): boolean {
  try {
    // Intenta crear un contexto de WebGL
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}
/**
 * Comprueba si el navegador soporta backdrop-filter CSS.
 * Se usa para el fallback si WebGL no está disponible o para el efecto Glass simple.
 */
export function isBackdropFilterSupported(): boolean {
  // Crea un elemento de prueba
  const el = document.createElement("div");

  // Intenta aplicar el estilo y verifica si el navegador lo entiende
  // Algunos navegadores antiguos podían requerir -webkit-backdrop-filter, pero lo ignoraremos
  // por simplicidad moderna.
  el.style.backdropFilter = "blur(1px)";
  return el.style.backdropFilter !== "";
}

/**
 * Crea y devuelve un Mesh (malla) de un cubo simple para usar como fondo 3D por defecto.
 *
 * NOTA: Esta función añade una propiedad 'update' al mesh para animarlo,
 * que luego es llamada por el GlassBox.
 *
 * @returns {THREE.Mesh} El objeto 3D del cubo.
 */

export function createRotatingCubeBackground(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00aaff, // Color azul wireframe
    wireframe: true,
  });

  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0, -5);

  // Añadimos el método de animación para ser llamado por AnimateMesh
  (cube as any).update = (time: number) => {
    cube.rotation.x = time * 0.1;
    cube.rotation.y = time * 0.05;
  };

  return cube;
}
