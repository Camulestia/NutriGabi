import { jsonUtf8 } from "@/lib/api-response";
import { createScheduleItem, listScheduleItems } from "@/lib/services/repository";
import { ScheduleItem } from "@/lib/types";

export async function GET() {
  return jsonUtf8(await listScheduleItems());
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Omit<ScheduleItem, "id" | "patientName"> & { patientId: string };
  const created = await createScheduleItem(payload);

  if (!created) {
    return jsonUtf8({ message: "Paciente não encontrado para agendamento" }, { status: 404 });
  }

  return jsonUtf8(created, { status: 201 });
}
