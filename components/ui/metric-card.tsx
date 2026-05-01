import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  subtitle,
  tone = "default",
  tooltip,
  className
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "mint" | "amber" | "rose";
  tooltip?: string;
  className?: string;
}) {
  const tones = {
    default: "bg-white border-line",
    mint: "bg-[#effbf8] border-[#caece6]",
    amber: "bg-[#fff7eb] border-[#f7dbad]",
    rose: "bg-[#fff1f1] border-[#f2d1d5]"
  };

  return (
    <div className={cn("rounded-3xl border p-4 shadow-sm", tones[tone], className)} title={tooltip}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
