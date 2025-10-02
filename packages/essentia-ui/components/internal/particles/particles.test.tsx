import { describe, it, afterEach, expect } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { Root, Icon, Flex, Action, Text } from ".";

describe("Root Atom", () => {
  afterEach(cleanup);
  it("Debe renderizar atom", () => {
    render(<Root />);
    const atom = screen.getByTestId("root");
    expect(atom.isConnected).toEqual(true);
  });
  it("Renderiza children prop", () => {
    render(
      <Root>
        <div>Hello world.</div>
        <span>SPAN</span>
      </Root>,
    );
    const atom = screen.getByTestId("root");
    expect(atom.children.length).toEqual(2);
    expect(atom.children.item(0)?.textContent).toEqual("Hello world.");
  });
  it("Renderiza con className", () => {
    render(<Root className={"testClass"}></Root>);

    const atom = screen.getByTestId("root");
    expect(atom.classList.contains("testClass")).toBeTruthy;
  });

  it("Renderiza con width prop", () => {
    render(<Root width="10px"></Root>);
    const atom = screen.getByTestId("root");
    expect(atom.style.width).toEqual("10px");
  });
});

describe("Flex Atom", () => {
  afterEach(cleanup);
  it("Debe renderizar atom", () => {
    render(<Flex />);
    const atom = screen.getByTestId("flex");
    expect(atom.isConnected).toEqual(true);
  });
  it("Renderiza children prop", () => {
    render(
      <Flex>
        <div>icon</div>
        <span>text</span>
        <button>button</button>
      </Flex>,
    );
    const atom = screen.getByTestId("flex");
    expect(atom.children.length).toEqual(3);
    expect(atom.children.item(0)?.textContent).toEqual("icon");
  });
  it("Renderiza con className", () => {
    render(<Flex className="someClass" />);
    const atom = screen.getByTestId("flex");
    expect(atom.classList.contains("someClass")).toBeTruthy;
  });
});

describe("Icon Atom", () => {
  afterEach(cleanup);
  it("Debe renderizar atom", () => {
    render(<Icon />);
    const atom = screen.getByTestId("icon");
    expect(atom.isConnected).toEqual(true);
  });
  it("Renderiza children prop", () => {
    render(
      <Icon>
        <svg></svg>
      </Icon>,
    );
    const atom = screen.getByTestId("icon");
    expect(atom.children.length).toEqual(1);
    expect(atom.children.item(0)?.tagName).toEqual("svg");
  });
});

describe("Action Atom", () => {
  afterEach(cleanup);
  it("Debe renderizar atom", () => {
    render(<Action />);
    const atom = screen.getByTestId("action");
    expect(atom.isConnected).toEqual(true);
  });
  it("Renderiza children prop", () => {
    render(
      <Action>
        <button>Submit</button>
      </Action>,
    );
    const atom = screen.getByTestId("action");
    expect(atom.children.length).toEqual(1);
    expect(atom.children.item(0)?.tagName).toEqual("BUTTON");
  });
});

describe("Text Atom", () => {
  afterEach(cleanup);
  it("Debe renderizar atom", () => {
    render(<Text />);
    const atom = screen.getByTestId("text");
    expect(atom.isConnected).toEqual(true);
  });
  it("Renderiza children prop", () => {
    render(
      <Text>
        Hello <strong>World</strong>
      </Text>,
    );
    const atom = screen.getByTestId("text");
    expect(atom.children.length).toEqual(1);
    expect(atom.tagName).toEqual("SPAN");
  });
});
