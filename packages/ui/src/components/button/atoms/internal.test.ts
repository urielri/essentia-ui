import { describe, expect, it } from "vitest";
import { addClass, atoms, getAtom, getAtoms } from "./internal";

describe("getAtom function", () => {
  it("returns Error if atom not found", () => {
    expect(async () => getAtom("fakeAtom")).rejects.toThrowError(
      "Atom not found",
    );
  });
  it("Returns Atom HTMLElement ", () => {
    const element = document.createElement("div");
    element.id = atoms.root;
    document.body.appendChild(element);
    const atom = getAtom(atoms.root);
    /** Si esta conectado al dom es porque existe y hay alcance. */
    expect(atom.isConnected).toEqual(true);
  });
});

describe("getAtoms function", () => {
  it("Returns Error if some value is invalid", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = atoms.root;
    document.body.appendChild(rootAtom);

    const textAtom = document.createElement("span");
    rootAtom.id = atoms.icon;
    document.body.appendChild(textAtom);

    expect(async () => getAtoms(["root", "text"])).rejects.toThrowError(
      "Atom not found",
    );
  });
  it("Returns list of atoms", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = atoms.root;
    document.body.appendChild(rootAtom);

    const textAtom = document.createElement("span");
    rootAtom.id = atoms.text;
    document.body.appendChild(textAtom);

    const list = getAtoms(["root", "text"]);

    expect(list.length).toEqual(2);
  });
});

describe("addClass Function", () => {
  it("Returns error if atoms param is empty", () => {
    expect(async () => addClass([], "")).rejects.toThrowError(
      "Atoms cannot be empty",
    );
  });
  it("Returns error if className param is empty and cb is undefined", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = atoms.root;
    document.body.appendChild(rootAtom);

    const atom = getAtom("root");

    expect(async () => addClass([atom], "")).rejects.toThrowError(
      "ClassName cannot be empty",
    );
  });
  it("Add class to atom", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = atoms.root;
    document.body.appendChild(rootAtom);

    const atom = getAtom("root");
    addClass(atom, "someClass");
    expect(atom.classList.contains("someClass")).toBeTruthy();
  });
  it("Add class to list atoms", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = atoms.root;
    document.body.appendChild(rootAtom);

    const textAtom = document.createElement("span");
    textAtom.id = atoms.text;
    document.body.appendChild(textAtom);

    const listAtoms = getAtoms(["root", "text"]);

    addClass(listAtoms, "someClass");

    expect(document.getElementsByClassName("someClass").length).toEqual(2);
  });
  it("Add class with Callback function just one atom", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = atoms.root;
    document.body.appendChild(rootAtom);

    const atom = getAtom("root");

    addClass(atom, "", (atom) => {
      atom.classList.add("anotherClass");
    });

    expect(atom.classList.contains("anotherClass")).toBeTruthy();
  });

  it("Add class with Callback function of list atoms", () => {
    const rootAtom = document.createElement("div");
    rootAtom.id = atoms.root;
    document.body.appendChild(rootAtom);

    const textAtom = document.createElement("span");
    textAtom.id = atoms.text;
    document.body.appendChild(textAtom);

    const listAtoms = getAtoms(["root", "text"]);

    addClass(listAtoms, "", (atom) => {
      atom.classList.add("anotherClass");
    });

    expect(document.getElementsByClassName("anotherClass").length).toEqual(2);
  });
});

describe.skip("setDefaultValues function", () => {});
