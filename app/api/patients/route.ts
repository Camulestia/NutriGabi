import { jsonError, jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { createPatient, listPatients } from "@/lib/services/repository";
import { Patient } from "@/lib/types";

export async function GET(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");

  return jsonUtf8(
    await listPatients({
      search,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 50
    })
  );
}

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as Omit<Patient, "id" | "consultations" | "reports">;
    const created = await createPatient({
      id: `pat-${Date.now()}`,
      ...payload
    });

    return jsonUtf8(created, { status: 201 });
  } catch (error) {
    return jsonError(error, "Não foi possível cadastrar o paciente.");
  }
}
