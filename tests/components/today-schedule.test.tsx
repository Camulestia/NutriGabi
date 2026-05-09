import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TodaySchedule } from "@/components/patient/today-schedule";
import { createPatient, createScheduleItem } from "@/tests/factories";
import { renderComponent } from "@/tests/test-utils";

describe("TodaySchedule", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("opens the appointment modal and requires an explicit patient choice", async () => {
    const user = userEvent.setup();
    const firstPatient = createPatient({ id: "pat-1", name: "Maria" });
    const secondPatient = createPatient({ id: "pat-2", name: "João", email: "joao@example.com" });

    renderComponent(
      <TodaySchedule
        schedule={[]}
        patients={[firstPatient, secondPatient]}
        canManageSchedule
        onScheduleCreated={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /nova consulta na agenda/i }));
    await user.click(screen.getByRole("button", { name: /salvar agendamento/i }));

    expect(screen.getByText("Selecione um paciente para o agendamento.")).toBeInTheDocument();
    expect(screen.getByLabelText("Paciente")).toHaveValue("");
  });

  it("creates an appointment for the selected patient instead of using the first one", async () => {
    const user = userEvent.setup();
    const onScheduleCreated = vi.fn();
    const firstPatient = createPatient({ id: "pat-1", name: "Maria" });
    const secondPatient = createPatient({ id: "pat-2", name: "João", email: "joao@example.com" });
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify(createScheduleItem({ id: "sched-2", patientId: "pat-2", patientName: "João" })), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    renderComponent(
      <TodaySchedule
        schedule={[]}
        patients={[firstPatient, secondPatient]}
        canManageSchedule
        onScheduleCreated={onScheduleCreated}
      />
    );

    await user.click(screen.getByRole("button", { name: /nova consulta na agenda/i }));
    await user.selectOptions(screen.getByLabelText("Paciente"), "pat-2");
    await user.click(screen.getByRole("button", { name: /salvar agendamento/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(String((options as RequestInit).body));
    expect(body.patientId).toBe("pat-2");
    expect(onScheduleCreated).toHaveBeenCalledWith(expect.objectContaining({ patientId: "pat-2" }));
  });
});
