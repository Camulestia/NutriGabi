import userEvent from "@testing-library/user-event";
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConsultationWizardV3 } from "@/components/consultation/consultation-wizard-v3";
import { createConsultation, createPatient } from "@/tests/factories";
import { renderComponent } from "@/tests/test-utils";

vi.mock("@/components/report/report-pdf", () => ({
  ReportPdfDownload: ({ label = "Exportar PDF" }: { label?: string }) => <button>{label}</button>
}));

describe("ConsultationWizardV3", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/billing")) {
        return new Response(JSON.stringify({ access: { canExportPdf: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (url.includes("/api/settings")) {
        return new Response(JSON.stringify({ reportSignature: "Nutri Teste", defaultPdfFooter: "Rodapé" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }) as typeof fetch;
  });

  it("renders step 1 with the consultation identification fields", () => {
    renderComponent(<ConsultationWizardV3 patient={createPatient()} initialConsultation={createConsultation()} />);

    expect(screen.getByRole("heading", { name: "Identificação" })).toBeInTheDocument();
    expect(screen.getByText("Data da consulta")).toBeInTheDocument();
    expect(screen.getByText("Motivo da visita")).toBeInTheDocument();
    expect(screen.getByText("Queixa principal")).toBeInTheDocument();
    expect(screen.getByText("Objetivo principal")).toBeInTheDocument();
  });

  it("renders step 8 actions and allows saving the professional assessment", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    renderComponent(
      <ConsultationWizardV3
        patient={createPatient()}
        initialConsultation={createConsultation()}
        initialStep={7}
      />
    );

    await user.type(screen.getByLabelText("Diagnóstico do profissional"), "Diagnóstico nutricional inicial");
    await user.type(screen.getByLabelText("Conduta"), "Plano alimentar e ajuste de rotina");
    await user.click(screen.getByRole("button", { name: /salvar avaliação/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /exportar pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /finalizar consulta/i })).toBeInTheDocument();
  });
});
