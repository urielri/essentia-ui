import s from "./s.module.css";
import { cleanup } from "@testing-library/react";
import { describe, expect, afterEach, it } from "vitest";
import { Assist, Base } from "./c";

import "../../globals.css";
import { getComponent } from "#components/internal/vault";
import { ICONS } from "#icons";

/**
 *
 * El chip puede contener
 * IMAGEN, ICONO, CLOSE ICON(action) o un CHECK ICON (seleccion multiple)
 * Puede ser draggable (si existe la palabra?)
 * Puede ser disabled
 * Puede ser de state ERROR (solo como input)
 * El chip puede ser INPUT, ASSIST, FILTER
 *
 *
 * TODO: Hacer que los chips sean drag & drop
 * */

const ROLE = "chip";
const TEXT = "Hello world";
describe("Base component", () => {
  afterEach(cleanup);
  it("Debe renderizar Base component", () => {
    expect(getComponent(<Base />, ROLE).isConnected).toBeTruthy();
  });
  it("Debe renderizar con children prop", () => {
    expect(getComponent(<Base>{TEXT}</Base>, ROLE).textContent).toEqual(TEXT);
  });
  it("Debe renderizar Base component con disabled prop", () => {
    const element = getComponent(<Base disabled />, ROLE);
    expect(element.classList.contains(s.disabled)).toBeTruthy();
  });
  it("Debe renderizar Base component con error prop ", () => {
    const element = getComponent(<Base error />, ROLE);
    expect(element.classList.contains(s.error)).toBeTruthy();
  });
});

describe("Chip Assist component", () => {
  afterEach(cleanup);
  it("Debe renderizar ", () => {
    const element = getComponent(<Assist>{TEXT}</Assist>, ROLE);
    expect(element.textContent).toEqual(TEXT);
  });
  it("Debe renderizar con error si intentamos pasar avatar & icon props", () => {
    expect(() =>
      getComponent(
        <Assist icon={ICONS.get("close")} avatar="url">
          {TEXT}
        </Assist>,
        ROLE,
      ),
    ).toThrowError("No se puede mostrar un icono si Avatar no es undefined");
  });
  it("Debe renderizar con icon prop", () => {
    const element = getComponent(
      <Assist icon={ICONS.get("information")}>{TEXT}</Assist>,
      ROLE,
    );

    expect(element.children[0].isConnected).toBeTruthy();
    expect(element.children.length).toEqual(2);
  });

  it("Debe renderizar con avatar prop", () => {
    const element = getComponent(
      <Assist avatar="https://URL_AVATAR" alt="ALT_AVATAR">
        {TEXT}
      </Assist>,
      ROLE,
    );

    expect(element.children[0].isConnected).toBeTruthy();
    expect(element.children.length).toEqual(2);
    const imageComponent = element.children[0].children[0] as HTMLImageElement;
    expect(imageComponent.src).toEqual(
      "/_next/image?url=https%3A%2F%2FURL_AVATAR&w=48&q=75",
    );
    expect(imageComponent.alt).toEqual("ALT_AVATAR");
  });
  it("Debe renderizar  con anchos especificos (minimo y maximo), cuando se muestra SOLAMENTE TEXTO", () => {
    const EXCEEDED_LENGTH = "lorem impsum lorem ipsum lorem";
    const element = getComponent(<Assist>{EXCEEDED_LENGTH}</Assist>, ROLE);

    // * Text ancho mínimo fijo de 67px máximo 165px
    expect(element.style.minWidth).toEqual("67px");
    expect(element.style.maxWidth).toEqual("165px");
  });

  it("Debe renderizar  con anchos especificos (minimo y maximo), cuando se muestra ICONO + TEXTO", () => {
    const EXCEEDED_LENGTH = "lorem impsum lorem ipsum lorem";
    const element = getComponent(
      <Assist icon={ICONS.get("information")}>{EXCEEDED_LENGTH}</Assist>,
      ROLE,
    );

    // Text+Icon ancho mínimo fijo de 95px máximo 193px
    expect(element.style.minWidth).toEqual("95px");
    expect(element.style.maxWidth).toEqual("193px");
  });

  it("Debe renderizar  con anchos especificos (minimo y maximo), cuando se muestra AVATAR + TEXTO", () => {
    const EXCEEDED_LENGTH = "lorem impsum lorem ipsum lorem";
    const element = getComponent(
      <Assist avatar="/as" alt="">
        {EXCEEDED_LENGTH}
      </Assist>,
      ROLE,
    );

    // Text+Image ancho mínimo fijo de 91px máximo 189px
    expect(element.style.minWidth).toEqual("91px");
    expect(element.style.maxWidth).toEqual("189px");
  });
});

describe("Chip Input component", () => {
  it("", () => {});
});
