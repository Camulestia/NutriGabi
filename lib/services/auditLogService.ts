import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getMockStateForUser } from "@/lib/services/mock-store";
import { withUserScopedAccess } from "@/lib/services/service-runtime";
import { AuditLogEntry } from "@/lib/types";

type AuditPayload = {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
};

export async function recordAuditLog(payload: AuditPayload) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      await prisma.auditLog.create({
        data: {
          userId: userProfile.id,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          metadata: payload.metadata ? (payload.metadata as Prisma.InputJsonValue) : undefined
        }
      });
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId) as typeof getMockStateForUser extends (...args: never[]) => infer T ? T & { auditLogs?: AuditLogEntry[] } : never;
      if (!state.auditLogs) {
        state.auditLogs = [];
      }

      state.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata ?? null,
        createdAt: new Date().toISOString()
      });
    }
  });
}

export async function listAuditLogs(limit = 50) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const logs = await prisma.auditLog.findMany({
        where: { userId: userProfile.id },
        orderBy: { createdAt: "desc" },
        take: limit
      });

      return logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: (log.metadata as Record<string, unknown> | null | undefined) ?? null,
        createdAt: log.createdAt.toISOString()
      }));
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId) as typeof getMockStateForUser extends (...args: never[]) => infer T ? T & { auditLogs?: AuditLogEntry[] } : never;
      return (state.auditLogs ?? []).slice(0, limit);
    }
  });
}
