import type { Vector3Tuple } from "three";

export interface CameraView {
  position: Vector3Tuple; // [x, y, z]
  target: Vector3Tuple; // Hacia dónde mira la cámara
  fov?: number; // Field of View (opcional)
}

export type ViewsMap = Record<string, CameraView>;
