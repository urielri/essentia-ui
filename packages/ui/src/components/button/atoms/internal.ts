/** All atoms for Button Molecule */
export const ATOMS = {
  button: "button",
  root: "root",
  icon: "icon",
  text: "text",
} as const;
export const DEFAULT_SIZE = "m" as Size;
export const atomsKeys = Object.values(ATOMS);

export type AtomsKeys = keyof typeof ATOMS;
export type Size = "xs" | "s" | "m" | "l" | "xl";

/**
 * Get element since DOM
 * @param {AtomsKeys|string} key
 * @returns {HTMLElement}
 */
export function getAtom<T = AtomsKeys>(key: T): HTMLElement {
  try {
    const element = document.getElementById(key as string);

    if (!element) throw new Error("Atom not found");

    return element;
  } catch (error: any) {
    throw new Error(`${error.message as string}: KEY ${key}..`);
  }
}

/**
 * Get list of atoms
 * @param {AtomsKeys[]} keys
 * @returns {HTMLElement[]}
 */
export function getAtoms<T = AtomsKeys>(keys: T[]): HTMLElement[] {
  const listElements: HTMLElement[] = [];
  if (keys.length === 0) throw new Error("Keys param cannot be empty");

  keys.forEach((value) => {
    const item = getAtom(value as AtomsKeys);
    listElements.push(item);
  });
  return listElements;
}

/**
 * Set default values for all atoms or those  that are not exluded
 * @param {string} className
 * @param {AtomsKeys[]} exclude
 * @returns {void}
 */
export function setDefaultValues(
  className: string,
  exclude?: AtomsKeys[],
): void {
  /** si <exclude> contiene valores, filtra */
  if (exclude && exclude.length > 0) {
    /** Ordenamos los arreglos para recorrerlos una vez */
    const excludeSort = exclude.sort();
    const atomsSort = Object.values(ATOMS).sort();

    const items: AtomsKeys[] = [];
    atomsSort.forEach((value, i) => {
      if (value !== excludeSort[i]) {
        items.push(value);
      }
    });
    addClass(getAtoms(items), className);
    return;
  }
  /** Setea todos los atomos con clase size-m por defecto */
  const listAtoms = getAtoms(atomsKeys);
  addClass(listAtoms, className);
  return;
}

/**
 *  Add specific className to HTMLElement OR HTMLElement[]
 * @param {HTMLElement[]} atoms
 * @param {string} className
 * @param {Function} cb callback
 * @returns {void}
 */
export function addClass(
  atoms: HTMLElement | HTMLElement[],
  className: string,
  cb?: (args: HTMLElement) => void,
): void {
  if (Array.isArray(atoms) && atoms.length === 0)
    throw new Error("Atoms cannot be empty");
  if (className === "" && !cb) throw new Error("ClassName cannot be empty");

  /** Si callback param existe, se recorre el arreglo atoms y se aplica en cada iteracion el callback */
  if (Array.isArray(atoms)) {
    if (cb) {
      atoms.forEach((value) => cb(value));
      return;
    }
    /** recorre los atomos y aplica la clase correspondiente */
    atoms.forEach((value) => {
      value.classList.add(className);
    });
    return;
  }
  /** Si hay un solo atomo, se aplica la clase correspondiente */
  if (cb) {
    cb(atoms);
    return;
  }
  atoms.classList.add(className);
  return;
}
