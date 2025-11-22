import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInYears } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "MMM d");
  } catch {
    return dateStr;
  }
}

export function calculateAge(birthDateStr: string | null | undefined): number | null {
  if (!birthDateStr) return null;
  try {
    const birthDate = parseISO(birthDateStr);
    // Check for placeholder years (like 5000)
    if (birthDate.getFullYear() > 2100) return null;
    return differenceInYears(new Date(), birthDate);
  } catch {
    return null;
  }
}

export function calculateYears(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    if (date.getFullYear() > 2100) return null;
    return differenceInYears(new Date(), date);
  } catch {
    return null;
  }
}
