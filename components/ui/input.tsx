import { AlertCircle, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  tooltip?: string;
  className?: string;
};

export function InputField({
  label,
  value,
  onChange,
  textarea,
  type,
  placeholder,
  hint,
  error,
  tooltip,
  className
}: InputProps) {
  const fieldClassName = cn(
    "w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-moss focus:ring-4 focus:ring-moss/10",
    textarea ? "min-h-32 resize-y" : "h-12",
    error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "",
    className
  );

  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
        {label}
        {tooltip ? (
          <span title={tooltip}>
            <Info className="h-4 w-4 text-muted" />
          </span>
        ) : null}
      </span>
      {textarea ? (
        <textarea
          className={fieldClassName}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type={type ?? "text"}
          className={fieldClassName}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? (
        <span className="mt-2 flex items-center gap-2 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      ) : hint ? (
        <span className="mt-2 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
