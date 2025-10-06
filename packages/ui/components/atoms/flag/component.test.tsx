
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Flag  from ".";

const Children = "Text";

describe("Flag test", () => {
  afterEach(cleanup);
  it("Renderiza componente", () => {
    render(
      <Flag type="secondary" state="soft">
        {Children}
      </Flag>,
    );
    expect(screen.getByText(Children)).toBeDefined();
  });
});
