import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dateString: string) {
  const birth = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(dateString));
}

export function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function currencylessDelta(current: number, previous: number) {
  const difference = current - previous;
  const percent = previous === 0 ? 0 : (difference / previous) * 100;
  return { difference, percent };
}
