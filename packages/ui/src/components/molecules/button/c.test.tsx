import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Root } from "../../core/particles";

describe("Button Molecule", () => {
  afterEach(cleanup);
  it("Render Button", () => {
    render(<Root />);
    const component = screen.getByTestId("root");
    expect(component.isConnected).toEqual(true);
  });
  it("Render Button with children props", () => {
    render(<Root>Hello world</Root>);
    const component = screen.getByTestId("root");
    expect(component.textContent).toEqual("Hello world");
  });
});
