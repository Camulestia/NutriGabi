import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PatientIntakeFormV2 } from "@/components/patient/patient-intake-form-v2";
import { renderComponent } from "@/tests/test-utils";

describe("PatientIntakeFormV2", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("shows required field feedback before submitting", async () => {
    const user = userEvent.setup();
    renderComponent(<PatientIntakeFormV2 />);

    await user.click(screen.getByRole("button", { name: /cadastrar paciente/i }));

    expect(screen.getByText("Informe o nome do paciente.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("warns about invalid email but still allows saving", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "pat-2" }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      })
    );

    const { container } = renderComponent(<PatientIntakeFormV2 />);

    await user.type(screen.getByRole("textbox", { name: "Nome" }), "Maria");
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
    const birthDateInput = container.querySelector('input[type="date"]');
    if (!birthDateInput) throw new Error("Campo de data não encontrado");
    await user.type(birthDateInput, "1990-01-01");
    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "maria");

    expect(screen.getByText("E-mail parece inválido. Verifique se contém @.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cadastrar paciente/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
