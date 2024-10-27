import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  addClass,
  PARTICLES,
  getParticle,
  getParticles,
  setValues,
} from "./rules";

function clean(): void {
  const elements = document.body.children;
  for (let i = 0; i < elements.length; i++) {
    const item = elements.item(i);
    if (item) item.remove();
  }
}

describe("getParticle function", () => {
  afterEach(clean);
  it("returns Error if particle not found", () => {
    expect(async () => getParticle("fakeParticle")).rejects.toThrowError(
      "Particle not found",
    );
  });
  it("Returns Particle HTMLElement ", () => {
    const element = document.createElement("div");
    element.id = PARTICLES.root;
    document.body.appendChild(element);
    const particle = getParticle(PARTICLES.root);
    /** Si esta conectado al dom es porque existe y hay alcance. */
    expect(particle.isConnected).toEqual(true);
  });
});

describe("getParticles function", () => {
  afterEach(clean);
  it("Returns Error if some value is invalid", () => {
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);

    const textParticle = document.createElement("span");
    textParticle.id = PARTICLES.text;
    document.body.appendChild(textParticle);

    expect(async () => getParticles(["root", "icon"])).rejects.toThrowError(
      "Particle not found",
    );
  });
  it("Returns list of particles", () => {
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);

    const textParticle = document.createElement("span");
    textParticle.id = PARTICLES.text;
    document.body.appendChild(textParticle);

    const list = getParticles(["root", "text"]);

    expect(list.length).toEqual(2);
  });
});

describe("addClass Function", () => {
  afterEach(clean);
  it("Returns error if particles param is empty", () => {
    expect(async () => addClass([], "")).rejects.toThrowError(
      "Particles cannot be empty",
    );
  });
  it("Returns error if className param is empty and cb is undefined", () => {
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);

    const particle = getParticle("root");

    expect(async () => addClass([particle], "")).rejects.toThrowError(
      "ClassName cannot be empty",
    );
  });
  it("Add class to particle", () => {
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);

    const particle = getParticle("root");
    addClass(particle, "someClass");
    expect(particle.classList.contains("someClass")).toBeTruthy();
  });
  it("Add class to list particles", () => {
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);

    const textParticle = document.createElement("span");
    textParticle.id = PARTICLES.text;
    document.body.appendChild(textParticle);

    const listAtoms = getParticles(["root", "text"]);

    addClass(listAtoms, "someClass");

    expect(document.getElementsByClassName("someClass").length).toEqual(2);
  });
  it("Add class with Callback function just one particle", () => {
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);

    const particle = getParticle("root");

    addClass(particle, "", (particle) => {
      particle.classList.add("anotherClass");
    });

    expect(particle.classList.contains("anotherClass")).toBeTruthy();
  });

  it("Add class with Callback function of list particles", () => {
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);

    const textParticle = document.createElement("span");
    textParticle.id = PARTICLES.text;
    document.body.appendChild(textParticle);

    const listAtoms = getParticles(["root", "text"]);

    addClass(listAtoms, "", (particle) => {
      particle.classList.add("anotherClass");
    });

    expect(document.getElementsByClassName("anotherClass").length).toEqual(2);
  });
});
describe("setDefaultValues function", () => {
  beforeEach(clean);
  it("Return error if if no particle is present", () => {
    expect(async () => setValues("someClass")).rejects.toThrowError(
      "Particle not found",
    );
  });
  it("Set default values without <exclude>", () => {
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);
    const textParticle = document.createElement("span");
    textParticle.id = PARTICLES.text;
    document.body.appendChild(textParticle);
    const buttonParticle = document.createElement("button");
    buttonParticle.id = PARTICLES.button;
    document.body.appendChild(buttonParticle);
    const iconParticle = document.createElement("div");
    iconParticle.id = PARTICLES.icon;
    document.body.appendChild(iconParticle);

    setValues("someClass");

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
    const rootParticle = document.createElement("div");
    rootParticle.id = PARTICLES.root;
    document.body.appendChild(rootParticle);
    const textParticle = document.createElement("span");
    textParticle.id = PARTICLES.text;
    document.body.appendChild(textParticle);
    // Si utilizo la className "someClass", el test no pasa
    // porque encuentra mas de dos elementos en el DOM
    // Volver a revisar donde se esta "filtrando" ese tercer elemento
    setValues("someClass2", ["icon", "button"]);

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
