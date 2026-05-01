"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-14 items-center gap-3 rounded-[22px] border border-line bg-white px-4 shadow-sm", className)}>
      <Search className="h-5 w-5 text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
