import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Tag  from ".";

const Children = "Text";

describe("Tag test", () => {
  afterEach(cleanup);
  it("Renderiza componente", () => {
    render(
      <Tag type="secondary" emphasis="soft">
        {Children}
      </Tag>,
    );
    expect(screen.getByText(Children)).toBeDefined();
  });

  it("Renderiza componente mostrando el icono info", () => {
    render(
      <Tag type="secondary" emphasis="soft" showIcon>
        {Children}
      </Tag>,
    );
    expect(screen.getByText(Children)).toBeDefined();
  });
});
