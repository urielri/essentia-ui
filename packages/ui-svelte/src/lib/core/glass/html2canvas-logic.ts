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
  newTexture.wrapS = THREE.ClampToEdgeWrapping; // Evita la repetición horizontal
  newTexture.wrapT = THREE.ClampToEdgeWrapping; // Evita la repetición vertical
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
  backgroundMesh.scale.set(planeWidth, planeHeight, 1);
  //backgroundMesh.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

  // Asignación de la textura
  const material = backgroundMesh.material as MeshBasicMaterial;
  material.map = newTexture;
  material.needsUpdate = true;
  backgroundMesh.position.set(0, 0, backgroundZ);
  backgroundMesh.visible = true;

  return newTexture;
}

export function createColorTexture(
  color: number | string,
  opacity: number,
): THREE.DataTexture {
  // Creamos un color con el alfa para que la textura no sea completamente opaca
  const r = new THREE.Color(color).r * 255 * opacity;
  const g = new THREE.Color(color).g * 255 * opacity;
  const b = new THREE.Color(color).b * 255 * opacity;

  // Usaremos un color plano para la DataTexture
  const data = new Uint8Array([r, g, b, opacity * 255]);

  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}
export function createGradientTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128; // Tamaño pequeño pero suficiente para el degradado
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(0, 0, 128, 128);
  gradient.addColorStop(0, "rgba(0, 0, 255, 0.5)"); // Azul semitransparente
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.7)"); // Blanco semitransparente
  gradient.addColorStop(1, "rgba(0, 255, 0, 0.5)"); // Verde semitransparente

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  // ... (restablecer minFilter/magFilter/wrapS/wrapT)
  texture.needsUpdate = true;
  return texture;
}

export function createFixedImageTexture(
  imageUrl: string,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();

    loader.load(
      imageUrl,
      (texture) => {
        // Configuración estándar para texturas de fondo
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Si solo quieres la textura, devuelve esto:
        // resolve(texture);

        // --- Implementación del Degradado de Color (Superposición) ---

        const canvas = document.createElement("canvas");
        // Usamos un tamaño base para el canvas; idealmente debería coincidir con el tamaño de la imagen.
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // 1. Dibujar la Imagen (Ruido)
        // Usamos createImageBitmap para obtener la imagen de la textura
        const img = texture.image;
        ctx.drawImage(img, 0, 0, size, size);

        // 2. Dibujar el Degradado Semitransparente Encima
        const gradient = ctx.createLinearGradient(0, 0, size, size);

        // Puedes ajustar estos colores para el efecto "vidrio" que buscas
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)"); // Blanco/Gris claro
        gradient.addColorStop(1, "rgba(100, 100, 100, 0.6)"); // Gris oscuro

        ctx.fillStyle = gradient;
        // Aplica el degradado con blending (opcional)
        // ctx.globalCompositeOperation = 'source-atop';
        ctx.fillRect(0, 0, size, size);

        // Reemplaza la textura cargada con la nueva textura del Canvas
        const finalTexture = new THREE.CanvasTexture(canvas);
        finalTexture.minFilter = THREE.LinearFilter;
        finalTexture.magFilter = THREE.LinearFilter;
        finalTexture.wrapS = THREE.ClampToEdgeWrapping;
        finalTexture.wrapT = THREE.ClampToEdgeWrapping;

        resolve(finalTexture);
      },
      undefined, // Callback de progreso (no necesitamos)
      (err) => {
        console.error("Error al cargar la textura de imagen:", err);
        reject(err);
      },
    );
  });
}

export function setupRenderTarget(
  width: number,
  height: number,
  renderTarget: THREE.WebGLRenderTarget | null,
): THREE.WebGLRenderTarget {
  // Si el target no existe o necesita ser redimensionado (ej. resize de ventana)
  if (
    !renderTarget ||
    renderTarget.width !== width ||
    renderTarget.height !== height
  ) {
    // 1. Limpia el target antiguo si existe
    if (renderTarget) {
      renderTarget.dispose();
    }

    // 2. Crea o recrea el Render Target
    // Usar RGBAFormat y un tipo flotante es ideal si se necesitan colores de alta precisión,
    // aunque para el ruido simple, los defaults bastan.
    renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    // console.log("Render Target recreado a:", width, "x", height);
  }

  return renderTarget;
}
