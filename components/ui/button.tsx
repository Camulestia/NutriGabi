import { cn } from "@/lib/utils";

export function buttonStyles({
  variant = "primary",
  className
}: {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
}) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium leading-none transition disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" && "bg-moss text-white shadow-sm hover:bg-[#178978]",
    variant === "secondary" && "border border-line bg-white text-ink hover:border-moss/30 hover:bg-sage/60",
    variant === "outline" && "border border-moss/30 bg-white text-moss hover:bg-sage/60",
    variant === "ghost" && "text-muted hover:bg-slate-100",
    className
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  "aria-label": ariaLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={buttonStyles({ variant, className })}
      {...props}
    >
      {children}
    </button>
  );
}
