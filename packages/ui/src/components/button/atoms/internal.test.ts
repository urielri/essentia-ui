import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  addClass,
  ATOMS,
  getAtom,
  getAtoms,
  setDefaultValues,
} from "./internal";

function clean(): void {
  const elements = document.body.children;
  for (let i = 0; i < elements.length; i++) {
    const item = elements.item(i);
    if (item) item.remove();
  }
}

describe("getAtom function", () => {
  afterEach(clean);
  it("returns Error if atom not found", () => {
    expect(async () => getAtom("fakeAtom")).rejects.toThrowError(
      "Atom not found",
    );
  });
  it("Returns Atom HTMLElement ", () => {
    const element = document.createElement("div");
    element.id = ATOMS.root;
    document.body.appendChild(element);
    const atom = getAtom(ATOMS.root);
    /** Si esta conectado al dom es porque existe y hay alcance. */
    expect(atom.isConnected).toEqual(true);
  });
});

describe("getAtoms function", () => {
  afterEach(clean);
  it("Returns Error if some value is invalid", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);

    const textAtom = document.createElement("span");
    textAtom.id = ATOMS.text;
    document.body.appendChild(textAtom);

    expect(async () => getAtoms(["root", "icon"])).rejects.toThrowError(
      "Atom not found",
    );
  });
  it("Returns list of atoms", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);

    const textAtom = document.createElement("span");
    textAtom.id = ATOMS.text;
    document.body.appendChild(textAtom);

    const list = getAtoms(["root", "text"]);

    expect(list.length).toEqual(2);
  });
});

describe("addClass Function", () => {
  afterEach(clean);
  it("Returns error if atoms param is empty", () => {
    expect(async () => addClass([], "")).rejects.toThrowError(
      "Atoms cannot be empty",
    );
  });
  it("Returns error if className param is empty and cb is undefined", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);

    const atom = getAtom("root");

    expect(async () => addClass([atom], "")).rejects.toThrowError(
      "ClassName cannot be empty",
    );
  });
  it("Add class to atom", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);

    const atom = getAtom("root");
    addClass(atom, "someClass");
    expect(atom.classList.contains("someClass")).toBeTruthy();
  });
  it("Add class to list atoms", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);

    const textAtom = document.createElement("span");
    textAtom.id = ATOMS.text;
    document.body.appendChild(textAtom);

    const listAtoms = getAtoms(["root", "text"]);

    addClass(listAtoms, "someClass");

    expect(document.getElementsByClassName("someClass").length).toEqual(2);
  });
  it("Add class with Callback function just one atom", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);

    const atom = getAtom("root");

    addClass(atom, "", (atom) => {
      atom.classList.add("anotherClass");
    });

    expect(atom.classList.contains("anotherClass")).toBeTruthy();
  });

  it("Add class with Callback function of list atoms", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);

    const textAtom = document.createElement("span");
    textAtom.id = ATOMS.text;
    document.body.appendChild(textAtom);

    const listAtoms = getAtoms(["root", "text"]);

    addClass(listAtoms, "", (atom) => {
      atom.classList.add("anotherClass");
    });

    expect(document.getElementsByClassName("anotherClass").length).toEqual(2);
  });
});
describe("setDefaultValues function", () => {
  beforeEach(clean);
  it("Return error if if no atom is present", () => {
    expect(async () => setDefaultValues("someClass")).rejects.toThrowError(
      "Atom not found",
    );
  });
  it("Set default values without <exclude>", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);
    const textAtom = document.createElement("span");
    textAtom.id = ATOMS.text;
    document.body.appendChild(textAtom);
    const buttonAtom = document.createElement("button");
    buttonAtom.id = ATOMS.button;
    document.body.appendChild(buttonAtom);
    const iconAtom = document.createElement("div");
    iconAtom.id = ATOMS.icon;
    document.body.appendChild(iconAtom);

    setDefaultValues("someClass");

    const elements = document.body.getElementsByClassName("someClass");
    const isTrue = [];
    for (let i = 0; i < elements.length; i++) {
      const item = elements.item(i)?.classList.contains("someClass");
      if (item) isTrue.push(true);
      if (!item) isTrue.push(false);
    }

    expect(isTrue.every((value) => value)).toEqual(true);
  });
  it("Set default values with exclude list", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = ATOMS.root;
    document.body.appendChild(rootAtom);
    const textAtom = document.createElement("span");
    textAtom.id = ATOMS.text;
    document.body.appendChild(textAtom);
    // Si utilizo la className "someClass", el test no pasa
    // porque encuentra mas de dos elementos en el DOM
    // Volver a revisar donde se esta "filtrando" ese tercer elemento
    setDefaultValues("someClass2", ["icon", "button"]);

    const elements = document.body.getElementsByClassName("someClass2");
    const isTrue = [];

    for (let i = 0; i < elements.length; i++) {
      const item = elements.item(i)?.classList.contains("someClass2");
      if (item) isTrue.push(true);
      if (!item) isTrue.push(false);
    }

    expect(elements.length).toEqual(2);
    expect(isTrue.every((value) => value)).toEqual(true);
  });
});
