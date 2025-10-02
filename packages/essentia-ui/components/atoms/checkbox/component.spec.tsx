import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CheckBoxInput } from "./component";
import '@testing-library/jest-dom/vitest';

describe("Checkbox atom", () => {
    afterEach(cleanup);
    it("debe cambiar el estado de false a true cuando se lo selecciona", async() => {
      render(<CheckBoxInput checked={false} disabled={false} />)

      const checkbox = (await waitFor(() => screen.getByRole("checkbox"), {
        timeout: 60 * 1000,
      })) as HTMLInputElement;

      await userEvent.click(checkbox);

      expect(checkbox.checked).toBe(true);
      expect(checkbox).not.toBeDisabled();
    });

    it("debe cambiar el estado de true a false cuando se lo selecciona", async() => {
        render(<CheckBoxInput checked={true} disabled={false} />)
  
        const checkbox = (await waitFor(() => screen.getByRole("checkbox"), {
          timeout: 60 * 1000,
        })) as HTMLInputElement;
  
        await userEvent.click(checkbox);
  
        expect(checkbox.checked).toBe(false);
        expect(checkbox).not.toBeDisabled();
      });

      it("no debe cambiar el estado si está deshabilitado", async() => {
        render(<CheckBoxInput checked={false} disabled={true} />)
  
        const checkbox = (await waitFor(() => screen.getByRole("checkbox"), {
          timeout: 60 * 1000,
        })) as HTMLInputElement;

        expect(checkbox.checked).toBe(false);
  
        await userEvent.click(checkbox);
  
        expect(checkbox).toBeDisabled();
        expect(checkbox.checked).toBe(false);
      });
  });