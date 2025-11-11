import * as THREE from "three";
import html2canvas from "html2canvas";

// Tipos base para claridad (ajusta según tus tipos reales)
type Mesh = THREE.Mesh;
type CanvasTexture = THREE.CanvasTexture;
type MeshBasicMaterial = THREE.MeshBasicMaterial;

/**
 * Función de utilidad: Calcula las dimensiones 3D para llenar el frustum de la cámara.
 */
export function calculatePlaneDimensions(
  aspectRatio: number,
  cameraFOV: number,
  cameraZ: number,
  backgroundZ: number,
): { planeWidth: number; planeHeight: number; planeDistance: number } {
  const planeDistance = Math.abs(backgroundZ - cameraZ);
  const visibleHeight =
    2 * Math.tan(cameraFOV * 0.5 * (Math.PI / 180)) * planeDistance;
  const planeHeight = visibleHeight;
  const planeWidth = planeHeight * aspectRatio;

  return { planeWidth, planeHeight, planeDistance };
}

/**
 * Ejecuta la captura de HTML2Canvas (antes captureBackground).
 */
export async function captureBackground(
  targetRef: HTMLDivElement,
  threlteCanvas: HTMLCanvasElement | undefined,
  isSuspended: boolean,
  contentRef: HTMLDivElement | undefined,
): Promise<{ canvas: HTMLCanvasElement; rect: DOMRect } | null> {
  if (isSuspended || !targetRef || !threlteCanvas) return null;

  // Lógica de captura... (el contenido de tu antigua función captureBackground)
  const rect = targetRef.getBoundingClientRect();

  // 🔴 Implementar la lógica de z-index aquí si no quieres romper el flujo
  const canvas = await html2canvas(document.body, {
    // ... (tus opciones de html2canvas, usando rect para recorte) ...
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
    ignoreElements: (element) => {
      return element === threlteCanvas || element === contentRef;
    },
  });

  return { canvas, rect };
}

/**
 * Actualiza la geometría y textura del plano 3D (antes updateThreeJsPlane).
 */
export function updateThreeJsPlane(
  capturedCanvas: HTMLCanvasElement,
  backgroundMesh: Mesh,
  backgroundTexture: CanvasTexture | undefined,
  cameraFOV: number,
  cameraZ: number,
  backgroundZ: number,
): CanvasTexture {
  // 1. Actualiza la textura de Three.js
  let newTexture = backgroundTexture;
  if (newTexture) {
    newTexture.image = capturedCanvas;
    newTexture.needsUpdate = true;
  } else {
    newTexture = new THREE.CanvasTexture(capturedCanvas);
    newTexture.minFilter = THREE.LinearFilter;
    newTexture.magFilter = THREE.LinearFilter;
  }

  // 2. Redimensionamiento del Plano 3D
  const { width: pixelWidth, height: pixelHeight } = capturedCanvas;
  const aspectRatio = pixelWidth / pixelHeight;

  const { planeWidth, planeHeight } = calculatePlaneDimensions(
    aspectRatio,
    cameraFOV,
    cameraZ,
    backgroundZ,
  );

  // Recrear la geometría
  backgroundMesh.geometry.dispose();
  backgroundMesh.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

  // Asignación de la textura
  const material = backgroundMesh.material as MeshBasicMaterial;
  material.map = newTexture;
  material.needsUpdate = true;
  backgroundMesh.position.set(0, 0, backgroundZ);
  backgroundMesh.visible = true;

  return newTexture;
}
