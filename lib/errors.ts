import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

const defaultMessages = {
  patientSave: "Não foi possível salvar o paciente agora. Tente novamente.",
  consultationLoad: "Não foi possível carregar a consulta agora. Tente novamente.",
  reportGeneration: "Não foi possível gerar o relatório agora. Tente novamente.",
  appointmentCreate: "Não foi possível criar o agendamento agora. Tente novamente.",
  billingProcess: "Não foi possível processar a assinatura agora. Tente novamente.",
  aiRequest: "Não foi possível gerar a interpretação agora. Tente novamente ou preencha manualmente."
} as const;

export type UserMessageKey = keyof typeof defaultMessages;

function isUserMessageKey(value: string): value is UserMessageKey {
  return value in defaultMessages;
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  exposeMessage: boolean;

  constructor(message: string, options?: { statusCode?: number; code?: string; exposeMessage?: boolean }) {
    super(message);
    this.name = "AppError";
    this.statusCode = options?.statusCode ?? 500;
    this.code = options?.code ?? "APP_ERROR";
    this.exposeMessage = options?.exposeMessage ?? false;
  }
}

export function getUserFriendlyErrorMessage(error: unknown, fallbackKey: UserMessageKey | string = "patientSave") {
  const fallbackMessage = isUserMessageKey(fallbackKey) ? defaultMessages[fallbackKey] : fallbackKey;

  if (error instanceof AppError) {
    return error.exposeMessage ? error.message : fallbackMessage;
  }

  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    switch (error.code) {
      case "PLAN_UPGRADE_REQUIRED":
        return "Seu plano atual não permite concluir esta ação. Faça upgrade para continuar.";
      case "AI_TIMEOUT":
      case "AI_GENERATION_FAILED":
      case "AI_PAYLOAD_TOO_LARGE":
        return defaultMessages.aiRequest;
      default:
        break;
    }
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "PATIENT_NOT_FOUND":
        return "Paciente não encontrado.";
      case "UNAUTHENTICATED":
        return "Você precisa entrar novamente para continuar.";
      case "STRIPE_NOT_CONFIGURED":
        return "A cobrança ainda não está configurada neste ambiente.";
      default:
        break;
    }
  }

  return fallbackMessage;
}

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return 500;
}

function sanitizeErrorContext(context?: {
  userId?: string;
  entityId?: string;
  action?: string;
  route?: string;
  status?: string;
}) {
  return {
    userId: context?.userId,
    entityId: context?.entityId,
    action: context?.action,
    route: context?.route,
    status: context?.status,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(
  error: unknown,
  fallbackKey: UserMessageKey | string = "patientSave",
  context?: Parameters<typeof sanitizeErrorContext>[0]
) {
  const message = getUserFriendlyErrorMessage(error, fallbackKey);
  const status = getStatusCode(error);

  if (status >= 500) {
    Sentry.captureException(error, {
      tags: {
        action: context?.action,
        route: context?.route,
        status: String(status)
      },
      extra: sanitizeErrorContext(context)
    });
  }

  return NextResponse.json(
    {
      message,
      code: error && typeof error === "object" && "code" in error ? String(error.code) : undefined
    },
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}

export function handleApiError(
  error: unknown,
  options?: { fallbackKey?: UserMessageKey | string; context?: Parameters<typeof sanitizeErrorContext>[0] }
) {
  return createErrorResponse(error, options?.fallbackKey, options?.context);
}
