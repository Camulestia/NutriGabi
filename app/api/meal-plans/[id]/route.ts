import { jsonError, jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { duplicateMealPlan, setMealPlanStatus } from "@/lib/services/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const payload = (await request.json()) as {
    patientId: string;
    action: "duplicate" | "set-status";
    status?: "rascunho" | "ativo" | "arquivado";
  };

  try {
    if (payload.action === "duplicate") {
      const duplicated = await duplicateMealPlan(payload.patientId, id);
      if (!duplicated) {
        return jsonUtf8({ message: "Plano não encontrado" }, { status: 404 });
      }
      return jsonUtf8(duplicated);
    }

    if (!payload.status) {
      return jsonUtf8({ message: "Status é obrigatório" }, { status: 400 });
    }

    const updated = await setMealPlanStatus(payload.patientId, id, payload.status);

    if (!updated) {
      return jsonUtf8({ message: "Plano não encontrado" }, { status: 404 });
    }

    return jsonUtf8(updated);
  } catch (error) {
    return jsonError(error, "Não foi possível atualizar o plano alimentar.");
  }
}
