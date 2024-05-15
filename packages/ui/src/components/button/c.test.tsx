import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Root } from "./atoms";

describe("Button Atoms", () => {
  afterEach(cleanup);
  it("Render Root atom", () => {
    render(<Root />);
    const component = screen.getByTestId("root");
    expect(component.isConnected).toEqual(true);
  });
  it("Render Root atom with children props", () => {
    render(<Root>Hello world</Root>);
    const component = screen.getByTestId("root");
    expect(component.textContent).toEqual("Hello world");
  });
});
