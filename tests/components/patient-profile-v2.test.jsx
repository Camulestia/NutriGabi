import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PatientProfileV2 } from "@/components/patient/patient-profile-v2";
import { createConsultation, createPatient } from "@/tests/factories";
import { renderComponent } from "@/tests/test-utils";

vi.mock("@/components/charts/evolution-chart-v2", () => ({
  EvolutionChartV2: () => <div>EvolutionChartMock</div>
}));

vi.mock("@/components/report/report-pdf", () => ({
  ReportPdfDownload: ({ label = "Ver relatório" }) => <button>{label}</button>
}));

describe("PatientProfileV2", () => {
  it("renders the clinical warning when consent is pending", () => {
    const consultation = createConsultation();
    const patient = createPatient({
      consentToStoreHealthData: false,
      consentDate: undefined,
      consultations: [consultation]
    });

    renderComponent(
      <PatientProfileV2
        patient={patient}
        latest={consultation}
        history={[{ consultation, bmi: 26.4 }]}
        evolutionData={[]}
        alertItems={[{ label: "Retorno em atraso", tone: "amber" }]}
      />
    );

    expect(screen.getByText("Consentimento de dados sensíveis ainda pendente.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /editar dados de maria silva/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciar nova avaliação para maria silva/i })).toBeInTheDocument();
  });
});
