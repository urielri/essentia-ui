import { cleanup, render } from "@testing-library/react";
import { describe, afterEach, expect, it } from "vitest";
import { Base as Root, Supporting, Title } from "./c";
import { getComponent } from "#components/utils/internal/vault";

const ROLE = "label";
const TEXT = "Hello world";
describe("Label component", () => {
  afterEach(cleanup);
  it("Debe renderizar componente", () => {
    const component = getComponent(<Root></Root>, ROLE);
    expect(component.isConnected).toBeTruthy;
  });
  it("Debe renderizar title", () => {
    const component = getComponent(
      <Root>
        <Title>{TEXT}</Title>
      </Root>,
      ROLE,
    );
    expect(component.children[0].textContent).toEqual(TEXT);
    expect(component.isConnected).toBeTruthy;
  });
  it("Debe renderizar title con important prop", () => {
    const component = getComponent(
      <Root>
        <Title important>{TEXT}</Title>{" "}
      </Root>,
      ROLE,
    );
    expect(component.children[0].textContent?.endsWith("*")).toBeTruthy();
  });

  it("Debe renderizar title con info prop", () => {
    const component = getComponent(
      <Root>
        <Title info={<svg></svg>}>{TEXT}</Title>{" "}
      </Root>,
      ROLE,
    );
    expect(component.children[0].children.length).toEqual(1);
  });
  it("Debe renderizar error component", () => {
    const component = getComponent(
      <Root>
        <Supporting>{TEXT}</Supporting>
      </Root>,
      ROLE,
    );
    //expect(component.children[1].tagName).toEqual("INPUT");
    expect(component.children[0].tagName).toEqual("DIV");
  });
  it("Debe renderizar mensaje de error", () => {
    const component = getComponent(
      <Root>
        <Title>Title</Title>
        <input />
        <Supporting>Error message</Supporting>
      </Root>,
      ROLE,
    );
    expect(component.children[2].textContent).toEqual("Error message");
  });
});
