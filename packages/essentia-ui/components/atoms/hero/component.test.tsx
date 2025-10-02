import { render, screen } from "@testing-library/react";
import { Hero } from "./component"; // Asumiendo que Hero está en el archivo Hero.tsx
import { TITLES } from "./constants";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi, Mock, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const title = TITLES.get("/packs-adicionales") ?? "";

describe("Hero Component", () => {
  afterEach(cleanup);
  it("debe mostrar el titulo correcto segun la url de navegacion", () => {
    (usePathname as Mock).mockReturnValue("/packs-adicionales");
    render(<Hero />);
    const titleElement = screen.getByText(title);
    expect(titleElement).toBeDefined();
  });

  it("debe mostrar el children y ocultar el titulo", () => {
    (usePathname as Mock).mockReturnValue("/packs-adicionales");
    render(
      <Hero>
        <div>Custom children</div>
      </Hero>,
    );
    const childrenElement = screen.getByText("Custom children");
    expect(childrenElement).toBeDefined();
    const titleElement = screen.queryByText(title);
    expect(titleElement).toBeNull();
  });
});
