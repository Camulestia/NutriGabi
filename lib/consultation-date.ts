import { Consultation, Patient, ScheduleItem, ScheduleType } from "@/lib/types";

const RETURN_DAYS = 30;

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function normalizeScheduleDateKey(value: string | Date) {
  if (value instanceof Date) {
    return getLocalDateKey(value);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return getLocalDateKey(new Date(value));
}

export function isSameScheduleDay(first: string | Date, second: string | Date) {
  return normalizeScheduleDateKey(first) === normalizeScheduleDateKey(second);
}

export function getConsultationDateValue(dateString: string) {
  return dateString.slice(0, 10);
}

export function toConsultationIsoDate(dateString: string) {
  if (!dateString) return new Date().toISOString();

  if (dateString.includes("T")) {
    return new Date(dateString).toISOString();
  }

  return new Date(`${dateString}T12:00:00`).toISOString();
}

export function getNextReturnDate(dateString: string) {
  const date = new Date(toConsultationIsoDate(dateString));
  date.setDate(date.getDate() + RETURN_DAYS);
  return date;
}

export function shouldAppearInReturnList(dateString: string, currentDate = new Date()) {
  return currentDate >= getNextReturnDate(dateString);
}

export function mapVisitReasonToScheduleType(reason?: string): ScheduleType {
  const normalized = reason?.trim().toLowerCase() ?? "";

  if (normalized.includes("primeira")) return "primeira consulta";
  if (normalized.includes("reavalia")) return "reavaliação";
  if (normalized.includes("ajuste")) return "ajuste de plano alimentar";
  if (normalized.includes("física") || normalized.includes("fisica")) return "avaliação";
  if (normalized.includes("retorno")) return "retorno";

  return "avaliação";
}

export function buildCompletedScheduleItems(patients: Patient[]) {
  return patients.flatMap((patient) =>
    patient.consultations.map((consultation): ScheduleItem => {
      const date = new Date(consultation.createdAt);
      return {
        id: `schedule-${consultation.id}`,
        patientId: patient.id,
        patientName: patient.name,
        consultationId: consultation.id,
        date: normalizeScheduleDateKey(consultation.createdAt),
        time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        reason: consultation.visitReason || consultation.objective || "Consulta nutricional",
        type: mapVisitReasonToScheduleType(consultation.visitReason),
        status: "concluída"
      };
    })
  );
}
