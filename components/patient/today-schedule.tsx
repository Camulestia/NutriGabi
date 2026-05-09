"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, PlusCircle, Sparkles, Stethoscope, UserRound, X } from "lucide-react";

import { CalendarPicker } from "@/components/patient/calendar-picker";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { getLocalDateKey, isSameScheduleDay, normalizeScheduleDateKey } from "@/lib/consultation-date";
import { Patient, ScheduleItem, ScheduleStatus, ScheduleType } from "@/lib/types";

const scheduleTypeOptions: Array<{ label: string; value: ScheduleType }> = [
  { label: "Primeira consulta", value: "primeira consulta" },
  { label: "Retorno", value: "retorno" },
  { label: "Avaliação física", value: "avaliação" },
  { label: "Reavaliação", value: "reavaliação" }
];

type ScheduleFormState = {
  patientId: string;
  date: string;
  time: string;
  type: ScheduleType;
  notes: string;
};

function createInitialScheduleState(selectedDate: string): ScheduleFormState {
  return {
    patientId: "",
    date: selectedDate,
    time: "08:00",
    type: "retorno",
    notes: ""
  };
}

export function TodaySchedule({
  schedule,
  patients,
  billingReady,
  canManageSchedule,
  onScheduleCreated
}: {
  schedule: ScheduleItem[];
  patients: Patient[];
  billingReady: boolean;
  canManageSchedule: boolean;
  onScheduleCreated: (item: ScheduleItem) => void;
}) {
  const router = useRouter();
  const todayKey = getLocalDateKey(new Date());
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [form, setForm] = useState<ScheduleFormState>(() => createInitialScheduleState(todayKey));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setForm((current) => ({ ...current, date: current.date || selectedDate }));
  }, [selectedDate]);

  const patientOptions = useMemo(() => patients.map((patient) => ({ id: patient.id, label: patient.name })), [patients]);
  const highlightedDates = useMemo(() => Array.from(new Set(schedule.map((item) => normalizeScheduleDateKey(item.date)))), [schedule]);
  const visibleSchedule = useMemo(() => schedule.filter((item) => isSameScheduleDay(item.date, selectedDate)), [schedule, selectedDate]);
  const scheduleTitle = selectedDate === todayKey ? "Agenda de hoje" : `Agenda - ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR")}`;

  const handleCreateSchedule = async () => {
    if (!billingReady) {
      setFeedback("Carregando permissões da agenda. Tente novamente em instantes.");
      return;
    }

    if (!canManageSchedule) {
      router.push("/billing");
      return;
    }

    if (!form.patientId) {
      setFeedback("Selecione um paciente para o agendamento.");
      return;
    }

    if (!form.date || !form.time) {
      setFeedback("Informe data e horário do agendamento.");
      return;
    }

    setSaving(true);
    setFeedback(null);

    const reason = scheduleTypeOptions.find((option) => option.value === form.type)?.label ?? "Retorno";

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          consultationId: undefined,
          date: normalizeScheduleDateKey(form.date),
          time: form.time,
          reason,
          type: form.type,
          status: "agendada",
          notes: form.notes
        })
      });

      const payload = response.headers.get("content-type")?.includes("application/json") ? ((await response.json()) as ScheduleItem | { message: string }) : null;

      if (!response.ok || !payload || !("id" in payload)) {
        setFeedback((payload && "message" in payload && payload.message) || "Não foi possível salvar o agendamento.");
        setSaving(false);
        return;
      }

      onScheduleCreated(payload);
      setSaving(false);
      setOpen(false);
      setSelectedDate(normalizeScheduleDateKey(payload.date));
      setForm(createInitialScheduleState(normalizeScheduleDateKey(payload.date)));
    } catch {
      setSaving(false);
      setFeedback("Não foi possível salvar o agendamento.");
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage text-moss">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-ink">{scheduleTitle}</h2>
                <button
                  type="button"
                  onClick={() => setCalendarOpen((current) => !current)}
                  className="rounded-2xl border border-line p-2 text-muted transition hover:bg-sage/60 hover:text-ink"
                  aria-label="Escolher data da agenda"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted">Consultas do dia, com calendário visual e atualização imediata.</p>
            </div>
          </div>

          <Button
            type="button"
            data-testid="new-appointment-button"
            onClick={() => {
              if (!billingReady) {
                setFeedback("Carregando permissões da agenda. Tente novamente em instantes.");
                return;
              }
              if (!canManageSchedule) {
                router.push("/billing");
                return;
              }
              setOpen(true);
              setForm(createInitialScheduleState(selectedDate));
            }}
            aria-label="Nova consulta na agenda"
            disabled={!billingReady}
          >
            <PlusCircle className="h-4 w-4" />
            {billingReady ? "Nova consulta na agenda" : "Carregando agenda..."}
          </Button>
        </div>

        {!canManageSchedule ? (
          <div className="mt-5 rounded-3xl border border-[#caece6] bg-[#f8fdfc] p-4 text-sm text-muted">
            A agenda completa faz parte do plano Pro. Você ainda pode visualizar o histórico do dia e fazer upgrade quando quiser.
            <div className="mt-3">
              <Link href="/billing" className={buttonStyles({ className: "px-4 py-2.5" })}>
                <Sparkles className="h-4 w-4" />
                Fazer upgrade
              </Link>
            </div>
          </div>
        ) : null}

        {calendarOpen ? (
          <div className="mt-5">
            <CalendarPicker selectedDate={selectedDate} highlightedDates={highlightedDates} onSelectDate={setSelectedDate} />
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {visibleSchedule.length ? (
            visibleSchedule.map((item) => <ScheduleCard key={item.id} item={item} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-muted">
              {selectedDate === todayKey ? "Nenhuma consulta agendada para hoje." : "Nenhuma consulta agendada para a data selecionada."}
            </div>
          )}
        </div>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/30 px-4 py-8">
          <div data-testid="appointment-modal" className="w-full max-w-2xl rounded-[28px] border border-line bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-ink">Novo agendamento</h3>
                <p className="mt-1 text-sm text-muted">Escolha o paciente correto antes de salvar na agenda.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-line p-2 text-muted transition hover:bg-sage/60" aria-label="Fechar agendamento">
                <X className="h-4 w-4" />
              </button>
            </div>

            {feedback ? <div className="mt-5 rounded-2xl border border-[#f2d1d5] bg-[#fff1f1] px-4 py-3 text-sm text-[#b42318]">{feedback}</div> : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-ink">Paciente</span>
                <select
                  data-testid="appointment-patient-select"
                  className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
                  value={form.patientId}
                  onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))}
                >
                  <option value="">Selecione um paciente</option>
                  {patientOptions.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.label}
                    </option>
                  ))}
                </select>
              </label>
              <InputField label="Data" type="date" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: normalizeScheduleDateKey(value) }))} />
              <InputField label="Horário" type="time" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-ink">Tipo de atendimento</span>
                <select
                  className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ScheduleType }))}
                >
                  {scheduleTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <InputField label="Observações" value={form.notes} textarea placeholder="Observações do agendamento." onChange={(value) => setForm((current) => ({ ...current, notes: value }))} />
              <div className="rounded-3xl border border-line bg-[#f7f9fa] p-4 md:col-span-2">
                <p className="text-sm font-medium text-ink">Status</p>
                <p className="mt-1 text-sm text-muted">O agendamento será salvo como <strong>agendada</strong>.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleCreateSchedule} disabled={saving} data-testid="appointment-save-button">
                {saving ? "Salvando..." : "Salvar agendamento"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ScheduleCard({ item }: { item: ScheduleItem }) {
  const router = useRouter();
  const statusStyles: Record<ScheduleStatus, string> = {
    agendada: "bg-[#effbf8] text-[#0f766e]",
    concluída: "bg-[#eef6ff] text-[#1d4ed8]",
    cancelada: "bg-[#fff1f1] text-[#b42318]"
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/patients/${item.patientId}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/patients/${item.patientId}`);
        }
      }}
      className="rounded-3xl border border-line bg-white p-4 transition hover:border-moss/25 hover:shadow-card focus:outline-none focus:ring-4 focus:ring-moss/10"
      aria-label={`Abrir perfil de ${item.patientName}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{item.time}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusStyles[item.status]}`}>
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">{item.patientName}</p>
          <p className="mt-1 text-xs text-muted capitalize">
            {item.type} • {item.reason}
          </p>
          {item.notes ? <p className="mt-2 text-xs text-muted">{item.notes}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={buttonStyles({ variant: "secondary", className: "pointer-events-none px-3.5 py-2" })} aria-hidden="true">
            <UserRound className="h-4 w-4" />
            Abrir paciente
          </span>
          <Link
            href={`/patients/${item.patientId}/consultations/new`}
            className={buttonStyles({ className: "px-3.5 py-2" })}
            aria-label={`Iniciar consulta para ${item.patientName}`}
            onClick={(event) => event.stopPropagation()}
          >
            <Stethoscope className="h-4 w-4" />
            {item.status === "concluída" ? "Nova avaliação" : "Iniciar consulta"}
          </Link>
        </div>
      </div>
    </div>
  );
}
