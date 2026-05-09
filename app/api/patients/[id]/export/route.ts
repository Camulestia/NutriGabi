import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { exportPatientData } from "@/lib/services/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const exported = await exportPatientData(id);

  if (!exported) {
    return jsonUtf8({ message: "Paciente não encontrado" }, { status: 404 });
  }

  return new Response(JSON.stringify(exported, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="paciente-${id}.json"`
    }
  });
}
