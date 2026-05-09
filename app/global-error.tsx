"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-sand text-ink">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
          <div className="panel w-full rounded-[28px] border p-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Algo saiu do esperado</h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              Registramos o erro de forma segura para investigação. Tente novamente em instantes.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-moss px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#178978]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
