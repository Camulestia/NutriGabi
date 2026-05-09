type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __nutriRateLimitStore: Map<string, { count: number; resetAt: number }> | undefined;
}

const store = globalThis.__nutriRateLimitStore ?? new Map<string, { count: number; resetAt: number }>();
globalThis.__nutriRateLimitStore = store;

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (current.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);

  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt
  };
}

export function buildRateLimitKey(input: { scope: string; userId?: string; ip?: string | null }) {
  return [input.scope, input.userId || "anonymous", input.ip || "unknown"].join(":");
}
