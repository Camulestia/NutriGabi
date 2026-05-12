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

    renderComponent(<PatientIntakeFormV2 />);

    await user.type(screen.getByPlaceholderText("Nome completo do paciente"), "Maria");
    await user.type(document.querySelector('input[type="date"]') as HTMLInputElement, "1990-01-01");
    await user.type(screen.getByPlaceholderText("paciente@email.com"), "maria");

    expect(screen.getByText("E-mail parece inválido. Verifique se contém @.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cadastrar paciente/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
