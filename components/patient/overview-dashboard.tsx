"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ClipboardList, Search } from "lucide-react";

import { TodaySchedule } from "@/components/patient/today-schedule";
import { SearchInput } from "@/components/ui/search-input";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { buildCompletedScheduleItems, normalizeScheduleDateKey, shouldAppearInReturnList } from "@/lib/consultation-date";
import { Patient, ScheduleItem } from "@/lib/types";
import { calculateAge, formatDate } from "@/lib/utils";

type PatientLookup = {
  id: string;
  name: string;
  age: number;
  lastConsultationLabel: string;
  lastConsultationDate?: Date;
  lastWeight?: number;
  mainObjective: string;
};

function differenceInDays(from: Date, to: Date) {
  return Math.floor((toMidnight(from).getTime() - toMidnight(to).getTime()) / (1000 * 60 * 60 * 24));
}

function toMidnight(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toLookup(patient: Patient): PatientLookup {
  const lastConsultation = patient.consultations[0];

  return {
    id: patient.id,
    name: patient.name,
    age: calculateAge(patient.birthDate),
    lastConsultationLabel: lastConsultation ? formatDate(lastConsultation.createdAt) : "Sem consulta",
    lastConsultationDate: lastConsultation ? new Date(lastConsultation.createdAt) : undefined,
    lastWeight: lastConsultation?.anthropometry.currentWeight,
    mainObjective: patient.mainObjective
  };
}

export function OverviewDashboard({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState("");
  const [scheduledItems, setScheduledItems] = useState<ScheduleItem[]>([]);
  const today = new Date();
  const lookups = useMemo(() => patients.map(toLookup), [patients]);

  useEffect(() => {
    const loadSchedule = async () => {
      const response = await fetch("/api/schedule");
      if (!response.ok) return;
      const items = (await response.json()) as ScheduleItem[];
      setScheduledItems(items);
    };

    void loadSchedule();
  }, []);

  const schedule = useMemo(() => {
    const completedItems = buildCompletedScheduleItems(patients);
    const manualIds = new Set(scheduledItems.map((item) => `${item.patientId}-${normalizeScheduleDateKey(item.date)}-${item.time}-${item.status}`));

    return [
      ...scheduledItems.map((item) => ({ ...item, date: normalizeScheduleDateKey(item.date) })),
      ...completedItems.filter((item) => !manualIds.has(`${item.patientId}-${normalizeScheduleDateKey(item.date)}-${item.time}-${item.status}`))
    ].sort((first, second) => {
      const firstDate = new Date(`${first.date}T${first.time}`).getTime();
      const secondDate = new Date(`${second.date}T${second.time}`).getTime();
      return firstDate - secondDate;
    });
  }, [patients, scheduledItems]);

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return lookups.filter((patient) => patient.name.toLowerCase().includes(normalized)).slice(0, 6);
  }, [lookups, query]);

  const reminders = useMemo(() => {
    return lookups
      .filter((patient) => patient.lastConsultationDate)
      .map((patient) => ({
        ...patient,
        daysSinceLastConsultation: differenceInDays(today, patient.lastConsultationDate!)
      }))
      .filter((patient) => shouldAppearInReturnList(patient.lastConsultationDate!.toISOString(), today))
      .sort((a, b) => b.daysSinceLastConsultation - a.daysSinceLastConsultation);
  }, [lookups, today]);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const totalPatients = patients.length;
  const consultationsThisMonth = patients.reduce((total, patient) => {
    return total + patient.consultations.filter((consultation) => {
      const date = new Date(consultation.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }, 0);

  const activePatients = lookups.filter((patient) => {
    if (!patient.lastConsultationDate) return false;
    return differenceInDays(today, patient.lastConsultationDate) <= 60;
  }).length;

  const patientsInFollowUp = patients.filter((patient) => patient.consultations.length > 0).length;

  return (
    <section className="space-y-6">
      <Card className="p-6">
        <div className="relative">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente pelo nome..." />

          {query.trim() ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 rounded-[24px] border border-line bg-white p-3 shadow-card">
              {filteredPatients.length ? (
                <div className="space-y-2">
                  {filteredPatients.map((patient) => (
                    <Link
                      key={patient.id}
                      href={`/patients/${patient.id}`}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-sage/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{patient.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          {patient.age} anos • Última consulta: {patient.lastConsultationLabel}
                        </p>
                      </div>
                      <Search className="h-4 w-4 shrink-0 text-muted" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl px-4 py-4 text-sm text-muted">Nenhum paciente encontrado para essa busca.</div>
              )}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <TodaySchedule patients={patients} schedule={schedule} onScheduleCreated={(item) => setScheduledItems((current) => [...current, item])} />

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff7eb] text-[#b45309]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">Pacientes para retorno</h2>
              <p className="text-sm text-muted">Última consulta há mais de 30 dias.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {reminders.length ? (
              reminders.map((patient) => (
                <ReminderCard
                  key={patient.id}
                  patientId={patient.id}
                  name={patient.name}
                  objective={patient.mainObjective}
                  daysSinceLastConsultation={patient.daysSinceLastConsultation}
                  lastWeight={patient.lastWeight}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-muted">
                Nenhum paciente pendente de retorno 🎉
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage text-moss">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">Resumo geral</h2>
            <p className="text-sm text-muted">Indicadores rápidos para a rotina do consultório.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total de pacientes" value={String(totalPatients)} subtitle="Prontuários cadastrados" tone="mint" />
          <MetricCard label="Consultas no mês" value={String(consultationsThisMonth)} subtitle="Mês atual" />
          <MetricCard label="Pacientes ativos" value={String(activePatients)} subtitle="Últimos 60 dias" />
          <MetricCard label="Em acompanhamento" value={String(patientsInFollowUp)} subtitle="Com ao menos uma consulta" />
        </div>
      </Card>
    </section>
  );
}

function ReminderCard({
  patientId,
  name,
  objective,
  daysSinceLastConsultation,
  lastWeight
}: {
  patientId: string;
  name: string;
  objective: string;
  daysSinceLastConsultation: number;
  lastWeight?: number;
}) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/patients/${patientId}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/patients/${patientId}`);
        }
      }}
      className="cursor-pointer rounded-3xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-moss/25 hover:bg-sage/30 hover:shadow-card focus:outline-none focus:ring-4 focus:ring-moss/10"
      aria-label={`Abrir perfil de ${name}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="mt-1 text-xs text-muted">há {daysSinceLastConsultation} dias • {objective}</p>
          <p className="mt-2 text-sm text-muted">{lastWeight ? `Último peso: ${lastWeight} kg` : "Peso ainda não registrado"}</p>
        </div>
        <Link
          href={`/patients/${patientId}/consultations/new`}
          className={buttonStyles({ className: "px-4 py-2.5" })}
          aria-label={`Iniciar nova avaliação para ${name}`}
          onClick={(event) => event.stopPropagation()}
        >
          Nova avaliação
        </Link>
      </div>
    </div>
  );
}
