import { cleanup, render, screen } from "@testing-library/react";
import { type ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./c";
const BUTTON_ROLE = "b";

function getComponent<T = HTMLElement>(c: ReactElement, identifier: string): T {
  render(c);
  const component = screen.getByRole(identifier);
  return component as T;
}

const Svg = () => <svg></svg>;

describe("Button component", () => {
  afterEach(cleanup);
  it("Render button", () => {
    const text = "Hello world";
    const component = getComponent(<Button>{text}</Button>, BUTTON_ROLE);
    expect(component.isConnected).toBeTruthy();
    expect(component.textContent).toEqual(text);
  });
  it("Render Button with svgOnly property", async () => {
    const text = "hello world";
    expect(() =>
      getComponent(<Button svgOnly>{text}</Button>, BUTTON_ROLE),
    ).toThrowError("Children cannot be string if svgOnly's true");

    const component = getComponent(
      <Button svgOnly>{<Svg />}</Button>,
      BUTTON_ROLE,
    );
    expect(component.isConnected).toBeTruthy();
  });
  it("Render Button with suffix and prefix properties", () => {
    const componentWithIconRight = getComponent(
      <Button suffix={<Svg />}>Hello</Button>,
      BUTTON_ROLE,
    );
    expect(componentWithIconRight.children[1]?.isConnected).toBeTruthy();
    expect(componentWithIconRight.children[1]?.children[0]?.tagName).toEqual(
      "svg",
    );
    cleanup();

    const componentWithIconLeft = getComponent(
      <Button prefix={<Svg />}>Hello</Button>,
      BUTTON_ROLE,
    );
    expect(componentWithIconLeft.children[0]?.isConnected).toBeTruthy();
    expect(componentWithIconLeft.children[0]?.children[0]?.tagName).toEqual(
      "svg",
    );

    cleanup();

    const componentWithBothIcons = getComponent(
      <Button suffix={<Svg />} prefix={<Svg />}>
        Hello
      </Button>,
      BUTTON_ROLE,
    );

    expect(componentWithBothIcons.children.length).toEqual(3);
  });
});
