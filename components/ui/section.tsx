import { cn } from "@/lib/utils";

export function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p> : null}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
            {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
