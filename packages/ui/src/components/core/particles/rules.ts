import { Size } from "../../../types";

/** All PARTICLES */
export const PARTICLES = {
  button: "button",
  root: "root",
  icon: "icon",
  text: "text",
} as const;
export const PARTICLES_KEYS = Object.values(PARTICLES);
export type ParticlesKeys = keyof typeof PARTICLES;

export const DEFAULT_SIZE = "m" as Size;

/**
 * Get element since DOM
 * @param {ParticlesKeys|string} key
 * @returns {HTMLElement}
 */
export function getParticle<T = ParticlesKeys>(key: T): HTMLElement {
  try {
    const element = document.getElementById(key as string);
    if (!element) throw new Error("Particle not found");
    return element;
  } catch (error: any) {
    throw new Error(`${error.message as string}: KEY ${key}..`);
  }
}

/**
 * Get list of PARTICLES
 * @param {ParticlesKeys[]} keys
 * @returns {HTMLElement[]}
 */
export function getParticles<T = ParticlesKeys>(keys: T[]): HTMLElement[] {
  const listElements: HTMLElement[] = [];
  if (keys.length === 0) throw new Error("Keys param cannot be empty");

  keys.forEach((value) => {
    const item = getParticle(value as ParticlesKeys);
    listElements.push(item);
  });
  return listElements;
}

/**
 * Set values for all PARTICLES or those that are not exluded
 * @param {string} className
 * @param {ParticlesKeys[]} exclude
 * @returns {void}
 */
export function setValues(className: string, exclude?: ParticlesKeys[]): void {
  /** si <exclude> contiene valores, filtra */
  if (exclude && exclude.length > 0) {
    /** Ordenamos los arreglos para recorrerlos una vez */
    //const excludeSort = exclude.sort();
    const particlesSort = Object.values(PARTICLES).sort();

    const items: ParticlesKeys[] = [];
    particlesSort.forEach((value) => {
      if (!exclude.find((e) => e === value)) {
        items.push(value);
      }
    });
    addClass(getParticles(items), className);
    return;
  }
  /** Setea todos los atomos con clase size-m por defecto */
  const listPARTICLES = getParticles(PARTICLES_KEYS);
  addClass(listPARTICLES, className);
  return;
}

/**
 *  Add specific className to HTMLElement OR HTMLElement[]
 * @param {HTMLElement[]} PARTICLES
 * @param {string} className
 * @param {Function} cb callback
 * @returns {void}
 */
export function addClass(
  particles: HTMLElement | HTMLElement[],
  className: string,
  cb?: (args: HTMLElement) => void,
): void {
  if (Array.isArray(particles) && particles.length === 0)
    throw new Error("Particles cannot be empty");
  if (className === "" && !cb) throw new Error("ClassName cannot be empty");

  /** Si callback param existe, se recorre el arreglo particles y se aplica en cada iteracion el callback */
  if (Array.isArray(particles)) {
    if (cb) {
      particles.forEach((value) => cb(value));
      return;
    }
    /** recorre las particulas y aplica la clase correspondiente */
    particles.forEach((value) => {
      value.classList.add(className);
    });
    return;
  }
  /** Si hay una sola particula, se aplica la clase correspondiente */
  if (cb) {
    cb(particles);
    return;
  }
  particles.classList.add(className);
  return;
}
