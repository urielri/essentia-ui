import { setContext, getContext } from "svelte";

export class Engine {
  // --- 1. CORE & RENDERING (Performance) ---
  // Controla la calidad gráfica dinámica. Si los FPS bajan, bajamos el DPR.
  dpr = $state(1);
  quality = $state<"low" | "medium" | "high">("high");
  debugMode = $state(true); // Para mostrar helpers, grids, stats

  // --- 2. NAVIGATION & CAMERA (The Viewport) ---
  // En lugar de rutas URL, tenemos "Vistas" o "Coordenadas"
  currentView = $state<string>("home");
  isTransitioning = $state(false); // Bloquea inputs durante viajes de cámara

  // --- 3. UI SYSTEM (Glass Aesthetics) ---
  // Propiedades globales para que todos los objetos Glass se vean consistentes
  theme = $state({
    glassColor: "#ffffff",
    glassThickness: 1.5,
    glassRoughness: 0.2,
    chromaticAberration: 0.05,
  });

  // --- 4. INTERACTION STATE ---
  // Estado del cursor lógico (ya que el mouse real a veces se oculta)
  cursor = $state<"default" | "pointer" | "grab" | "text">("default");
  inputLocked = $state(false); // Para modales o pantallas de carga

  constructor() {
    // Lógica de inicialización si es necesaria
  }

  // Acciones (Métodos para mutar el estado de forma controlada)
  setDpr(value: number) {
    this.dpr = Math.min(Math.max(value, 0.5), 2); // Clamp entre 0.5 y 2
  }

  navigate(viewId: string) {
    if (this.currentView === viewId || this.isTransitioning) return;
    console.log(`Essentia: Navigating to ${viewId}`);
    this.isTransitioning = true;
    this.currentView = viewId;

    // Simular tiempo de transición (esto luego lo manejará el Layout real)
    setTimeout(() => {
      this.isTransitioning = false;
    }, 1000);
  }
}

// Clave para el contexto de Svelte
const KEY = Symbol("STATE");

export function createEngine() {
  const engine = new Engine();
  setContext(KEY, engine);
  return engine;
}

export function useEngine() {
  return getContext<Engine>(KEY);
}
