export const atoms = {
  button: "button",
  root: "root",
  icon: "icon",
  text: "text",
} as const;
export const DEFAULT_SIZE = "m" as Size;
export const atomsKeys = Object.values(atoms);

export type AtomsKeys = keyof typeof atoms;
export type Size = "xs" | "s" | "m" | "l" | "xl";

export function getAtom<T = AtomsKeys>(key: T): HTMLElement {
  const element = document.getElementById(key as string);
  if (!element) throw new Error("Atom not found");
  return element;
}

export function getAtoms<T = AtomsKeys>(keys: T[]): HTMLElement[] {
  const listElements: HTMLElement[] = [];

  if (getAtoms.length === 0) throw new Error("Keys param cannot be empty");

  keys.forEach((value) => {
    try {
      const iteration = getAtom(value as AtomsKeys);
      listElements.push(iteration);
    } catch (error: any) {
      throw new Error(`${error.message as string}: KEY ${value}..`);
    }
  });

  return listElements;
}

export function setDefaultValues(
  className: string,
  exclude?: AtomsKeys[],
): void {
  if (exclude && exclude.length > 0) {
    // si <exclude> contiene valores, filtra
    for (let [key] of atomsKeys) {
      if (exclude.find((e) => e === key)) continue;
      getAtom(key as AtomsKeys).classList.add(className);
    }
    return;
  }

  /** Setea todos los atomos con clase size-m por defecto */
  const listAtoms = getAtoms(atomsKeys);
  listAtoms.forEach((value) => {
    value.classList.add(className);
  });
  return;
}

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
