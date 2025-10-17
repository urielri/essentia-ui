import * as THREE from "three";
import { vertexShader, fragmentShader } from "./glass-shaders";
// Tipo para el Mesh que se usará como fondo, asegurando que sea un THREE.Mesh
type BackgroundMesh = THREE.Mesh;

export class RefractionScene {
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private renderTarget!: THREE.WebGLRenderTarget;
  private glassMaterial!: THREE.ShaderMaterial;
  private glassMesh!: THREE.Mesh;
  private backgroundMesh: BackgroundMesh | null = null;
  private frameId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    this.initScene();
    this.initGlassMesh();
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000,
    );
    // this.camera.position.z ya NO es necesario aquí, se calcula en onResize.

    // 1. Crear el Renderer, la Cámara, y el RenderTarget
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // Nota: Eliminamos el setSize inicial aquí, ya que onResize lo hará.

    this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height);

    // 2. 💡 LLAMAR A onResize AHORA: Todos los objetos están definidos.
    this.onResize();
  }
  private initGlassMesh(): void {
    this.glassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tBackground: { value: this.renderTarget.texture },
        iTime: { value: 0.0 },
        uDistortion: { value: 1.0 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      dithering: true,
    });

    const geometry = new THREE.PlaneGeometry(3, 3);
    this.glassMesh = new THREE.Mesh(geometry, this.glassMaterial);
    this.scene.add(this.glassMesh);
  }

  public setBackground(backgroundMesh: BackgroundMesh): void {
    if (this.backgroundMesh) {
      this.scene.remove(this.backgroundMesh);
    }
    this.backgroundMesh = backgroundMesh;
    this.scene.add(backgroundMesh);
  }
  public onResize(): void {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    // Estos objetos ya están garantizados de existir gracias al reordenamiento en initScene
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderTarget.setSize(this.width, this.height);

    // 3. Repetimos la lógica de cálculo de Z (sin cambios)
    const planeSize = 3;
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const distance = planeSize / 2 / Math.tan(fovInRadians / 2);
    const newZ = distance * Math.max(1, this.camera.aspect);

    this.camera.position.z = newZ;
  }

  public animate = (time: DOMHighResTimeStamp = 0): void => {
    this.glassMaterial.uniforms.iTime!.value = time * 0.001;

    // 1. Renderizar el Fondo al RenderTarget
    // 💡 IMPORTANTE: Asegurarse de que el backgroundMesh existe y es visible
    if (this.backgroundMesh) {
      // <-- Añadimos esta comprobación
      this.backgroundMesh.visible = true; // Aseguramos que el fondo sea visible para el renderTarget
    }
    this.glassMesh.visible = false; // Ocultamos el vidrio mientras capturamos el fondo

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // 2. Renderizar la Escena Final a la Pantalla
    this.glassMesh.visible = true; // Mostramos el vidrio
    if (this.backgroundMesh) {
      // <-- Si tenemos un fondo, lo hacemos invisible de nuevo
      this.backgroundMesh.visible = false; // 💡 Ocultamos el fondo para que no se renderice dos veces (solo queremos su imagen en la textura)
    }

    this.renderer.setRenderTarget(null); // Renderizar a la pantalla principal
    this.renderer.render(this.scene, this.camera);

    this.frameId = requestAnimationFrame(this.animate);
  };

  public dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.renderer.dispose();
    this.renderTarget.dispose();
  }
}
