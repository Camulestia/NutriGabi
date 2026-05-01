"use client";

import Link from "next/link";
import { Clock3, PlusCircle, Stethoscope, UserRound } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScheduleItem, ScheduleStatus } from "@/lib/types";

export function TodaySchedule({
  schedule,
  fallbackPatientId
}: {
  schedule: ScheduleItem[];
  fallbackPatientId?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage text-moss">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">Agenda de hoje</h2>
            <p className="text-sm text-muted">Consultas do dia e estrutura pronta para integração futura.</p>
          </div>
        </div>

        <Link
          href={fallbackPatientId ? `/patients/${fallbackPatientId}/consultations/new` : "/patients"}
          className={buttonStyles({ className: "px-4 py-2.5" })}
          aria-label="Nova consulta na agenda"
        >
          <PlusCircle className="h-4 w-4" />
          Nova consulta na agenda
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {schedule.length ? (
          schedule.map((item) => <ScheduleCard key={item.id} item={item} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-muted">
            Nenhuma consulta agendada para hoje.
          </div>
        )}
      </div>
    </Card>
  );
}

function ScheduleCard({ item }: { item: ScheduleItem }) {
  const statusStyles: Record<ScheduleStatus, string> = {
    agendada: "bg-[#effbf8] text-[#0f766e]",
    concluída: "bg-[#eef6ff] text-[#1d4ed8]",
    cancelada: "bg-[#fff1f1] text-[#b42318]"
  };

  return (
    <div className="rounded-3xl border border-line bg-white p-4">
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
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/patients/${item.patientId}`}
            className={buttonStyles({ variant: "secondary", className: "px-3.5 py-2" })}
            aria-label={`Abrir paciente ${item.patientName}`}
          >
            <UserRound className="h-4 w-4" />
            Abrir paciente
          </Link>
          <Link
            href={`/patients/${item.patientId}/consultations/new`}
            className={buttonStyles({ className: "px-3.5 py-2" })}
            aria-label={`Iniciar consulta para ${item.patientName}`}
          >
            <Stethoscope className="h-4 w-4" />
            {item.status === "concluída" ? "Nova avaliação" : "Iniciar consulta"}
          </Link>
        </div>
      </div>
    </div>
  );
}
