import { NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/errors";

export function jsonUtf8(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });
}

export function jsonError(error: unknown, fallbackMessage = "Não foi possível concluir a operação.") {
  return createErrorResponse(error, fallbackMessage, {
    action: "api.error",
    status: "failed"
  });
}
