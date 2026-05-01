import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProgressBar({
  steps,
  currentStep,
  onStepClick
}: {
  steps: readonly string[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}) {
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Fluxo da consulta</p>
          <p className="text-sm text-muted">{progress}% concluído</p>
        </div>
        <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">
          Etapa {currentStep + 1} de {steps.length}
        </span>
      </div>

      <div className="h-2 rounded-full bg-[#edf2f4]">
        <div className="h-2 rounded-full bg-moss transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
        {steps.map((step, index) => {
          const active = index === currentStep;
          const complete = index < currentStep;
          return (
            <button
              key={step}
              type="button"
              onClick={() => onStepClick?.(index)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                active
                  ? "border-moss bg-moss text-white shadow-sm"
                  : complete
                    ? "border-[#caece6] bg-[#effbf8] text-ink"
                    : "border-line bg-white text-ink hover:border-moss/35 hover:bg-sage/60"
              )}
            >
              <span className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                {complete ? <Check className="h-3.5 w-3.5" /> : null}
                Etapa {index + 1}
              </span>
              <span className="block text-sm font-medium leading-5">{step}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
