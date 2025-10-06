function getComponent<T extends HTMLElement>(
  component: React.ReactElement,
  role: string,
): T {
  const element = getComponent(component, role);
  expect(element.tagName).toEqual("BUTTON");
  return element as T;
}
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from ".";
import s from "./s.module.css";
const TEXT = "Hello world";
const Error = () => <div>Error</div>;
const ROLE = "button";

describe("Button test", () => {
  afterEach(cleanup);
  it("Renderiza componente", () => {
    const element = getComponent(<Button></Button>, ROLE);

    expect(element.isConnected).toBeTruthy();
  });
  it("Renderiza componente con props iniciales", () => {
    const element = getComponent<HTMLButtonElement>(
      <Button>{TEXT}</Button>,
      ROLE,
    );
    expect(element.textContent).toEqual(TEXT);
    expect(element.classList.contains(s.button)).toBeTruthy();
    expect(element.classList.contains(s["primary-default"])).toBeTruthy();
    expect(element.classList.contains(s.m)).toBeTruthy();
  });
  it("Renderiza componente con width & height props", () => {
    const element = getComponent(
      <Button width="300px" height={40}></Button>,
      ROLE,
    );

    expect(element.style.width).toEqual("300px");
    expect(element.style.height).toEqual("40px");
  });
  it("Renderiza componente con priority & sizes props", () => {
    const element = getComponent(
      <Button priority="primary" size="s"></Button>,
      ROLE,
    );

    expect(element.classList.contains(s["primary-default"])).toBeTruthy();
    expect(element.classList.contains(s.s)).toBeTruthy();
  });
  it("Renderiza componente con dataset props", () => {
    const element = getComponent(
      <Button data-user="User" data-say={TEXT}></Button>,
      ROLE,
    );
    expect(element.dataset.say).toEqual(TEXT);
    expect(element.dataset.user).toEqual("User");
  });
  it("Renderiza componente con disabled prop", () => {
    const element = getComponent<HTMLButtonElement>(
      <Button disabled></Button>,
      ROLE,
    );
    expect(element.classList.contains(s.disabled)).toBeTruthy();
    expect(element.classList.contains(s["disabled-default"]));
    expect(element.disabled).toBeTruthy();
  });
  it("Renderiza componente con style props", () => {
    const element = getComponent(
      <Button style={{ color: "red", fontSize: "12px" }}></Button>,
      ROLE,
    );
    expect(element.style.color).toEqual("red");
    expect(element.style.fontSize).toEqual("12px");
  });
  it("Renderiza componente con customClassName prop", () => {
    const element = getComponent(
      <Button className={"testClassName"}></Button>,
      ROLE,
    );
    expect(element.classList.contains("testClassName")).toBeTruthy();
    //Se evalua que solo se aplique la customClass y no las clases por defecto
    expect(element.classList.contains(s.default)).toBeFalsy();
  });
  it("Renderiza componente con svgOnly", () => {
    expect(() =>
      getComponent(
        <Button svgOnly>
          <Error />
        </Button>,
        ROLE,
      ),
    ).toThrowError("Button: Must expose the shape property");

    const element = getComponent(
      <Button svgOnly shape="square">
        <Error />
      </Button>,
      ROLE,
    );
    expect(element.classList.contains(s["square"])).toBeTruthy();
  });
  it("Renderiza componente con loading prop", () => {
    const element = getComponent<HTMLButtonElement>(
      <Button loading>TEXT</Button>,
      ROLE,
    );

    expect(element.disabled).toBeTruthy();
    expect(element.classList.contains(s.disabled));
    expect(element.classList.contains(s.loading));
  });
});
