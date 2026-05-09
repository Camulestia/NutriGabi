import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { handleApiError } from "@/lib/errors";
import { createScheduleItem, listScheduleItems } from "@/lib/services/repository";
import { ScheduleItem } from "@/lib/types";

export async function GET() {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    return jsonUtf8(await listScheduleItems());
  } catch (error) {
    return handleApiError(error, {
      fallbackKey: "appointmentCreate",
      context: { action: "schedule.list", route: "/api/schedule", status: "failed" }
    });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as Omit<ScheduleItem, "id" | "patientName"> & { patientId: string };
    const created = await createScheduleItem(payload);

    if (!created) {
      return jsonUtf8({ message: "Paciente não encontrado para agendamento" }, { status: 404 });
    }

    return jsonUtf8(created, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      fallbackKey: "appointmentCreate",
      context: { action: "schedule.create", route: "/api/schedule", status: "failed" }
    });
  }
}
