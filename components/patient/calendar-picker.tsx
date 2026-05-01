"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getMonthMatrix(monthCursor: Date) {
  const firstDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const startDay = new Date(firstDay);
  startDay.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDay);
    day.setDate(startDay.getDate() + index);
    return day;
  });
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CalendarPicker({
  selectedDate,
  highlightedDates,
  onSelectDate
}: {
  selectedDate: string;
  highlightedDates: string[];
  onSelectDate: (date: string) => void;
}) {
  const selected = new Date(`${selectedDate}T12:00:00`);
  const monthCursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const days = getMonthMatrix(monthCursor);
  const todayKey = toDateKey(new Date());
  const markers = new Set(highlightedDates);
  const monthLabel = monthCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="rounded-[24px] border border-line bg-white p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          className="h-10 w-10 rounded-2xl px-0"
          onClick={() => {
            const next = new Date(monthCursor);
            next.setMonth(next.getMonth() - 1);
            onSelectDate(toDateKey(next));
          }}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold capitalize text-ink">{monthLabel}</p>
        <Button
          type="button"
          variant="secondary"
          className="h-10 w-10 rounded-2xl px-0"
          onClick={() => {
            const next = new Date(monthCursor);
            next.setMonth(next.getMonth() + 1);
            onSelectDate(toDateKey(next));
          }}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayKey = toDateKey(day);
          const isSelected = dayKey === selectedDate;
          const isToday = dayKey === todayKey;
          const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
          const hasAppointments = markers.has(dayKey);

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDate(dayKey)}
              className={cn(
                "relative flex h-11 flex-col items-center justify-center rounded-2xl border text-sm transition",
                isSelected
                  ? "border-moss bg-moss text-white shadow-sm"
                  : isToday
                    ? "border-moss/35 bg-sage/50 text-ink"
                    : "border-transparent bg-white text-ink hover:border-line hover:bg-sage/40",
                !isCurrentMonth && !isSelected ? "text-muted/60" : ""
              )}
              aria-label={`Selecionar ${day.toLocaleDateString("pt-BR")}`}
            >
              <span>{day.getDate()}</span>
              {hasAppointments ? (
                <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : "bg-moss")} />
              ) : (
                <span className="mt-1 h-1.5 w-1.5 rounded-full opacity-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
