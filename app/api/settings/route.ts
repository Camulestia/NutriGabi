import { jsonError, jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { getUserSettings, updateUserSettings } from "@/lib/services/repository";
import { UserSettings } from "@/lib/types";

export async function GET() {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  return jsonUtf8(await getUserSettings());
}

export async function PATCH(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as Partial<Omit<UserSettings, "email" | "plan">>;
    return jsonUtf8(await updateUserSettings(payload));
  } catch (error) {
    return jsonError(error, "Não foi possível salvar as configurações.");
  }
}
