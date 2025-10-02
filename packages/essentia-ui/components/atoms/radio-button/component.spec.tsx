import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RadioInput } from "./component";
import '@testing-library/jest-dom/vitest';

describe("Radio atom", () => {
    afterEach(cleanup);
    it("debe mostrar el estado por defecto", async() => {

      const initialState = false;
      render(<RadioInput checked={initialState} disabled={false} />)

      const radio = (await waitFor(() => screen.getByRole("radio"), {
        timeout: 60 * 1000,
      })) as HTMLInputElement;

      expect(radio.checked).toBe(initialState);
      expect(radio).not.toBeDisabled();
    });
  });