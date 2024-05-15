import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Root, Button, Icon, Text } from ".";

describe("Root Atom", () => {
  afterEach(cleanup);
  it("Render Root ", () => {
    render(<Root />);
    const component = screen.getByTestId("root");
    expect(component.isConnected).toEqual(true);
  });
  it("Render Root with children prop", () => {
    render(<Root>Hello world</Root>);
    const component = screen.getByTestId("root");
    expect(component.textContent).toEqual("Hello world");
  });
  it("Render root with custom className prop", () => {
    render(<Root className="classStyle"></Root>);
    const component = screen.getByTestId("root") as HTMLDivElement;
    expect(component.className).toEqual("classStyle");
  });
});

describe("Buttom Atom", () => {
  afterEach(cleanup);
  it("Render Button", () => {
    render(<Button />);
    const component = screen.getByTestId("button");
    expect(component.isConnected).toEqual(true);
  });
  it("Render Button with children prop", () => {
    render(<Button>Hello world</Button>);
    const component = screen.getByTestId("button") as HTMLButtonElement;
    expect(component.textContent).toEqual("Hello world");
  });
  it("Render Button with type prop", () => {
    render(<Button type="button"></Button>);
    const component = screen.getByTestId("button") as HTMLButtonElement;
    expect(component.type).toEqual("button");
  });
});

describe("Icon Atom", () => {
  afterEach(cleanup);
  it("Render Icon", () => {
    render(<Icon />);
    const component = screen.getByTestId("icon");
    expect(component.isConnected).toEqual(true);
  });
  it("Render Icon with icon prop", () => {
    render(
      <Icon>
        <svg></svg>
      </Icon>,
    );
    const component = screen.getByTestId("icon");
    expect(component.children[0]?.isConnected).toEqual(true);
  });
  it("Render Icon with styles prop", () => {
    render(
      <Icon>
        <svg></svg>
      </Icon>,
    );
  });
});

describe("Text Atom", () => {
  afterEach(cleanup);
  it("Render Text", () => {
    render(<Text></Text>);
    const component = screen.getByTestId("text");
    expect(component.isConnected).toEqual(true);
  });
  it("Render Text with text prop", () => {
    render(<Text>Hello world</Text>);
    const component = screen.getByTestId("text");
    expect(component.textContent).toEqual("Hello world");
  });
});

describe.skip("Sizes Atom", () => {});
