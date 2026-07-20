import type { AppLocale } from "@/lib/types/locale";

const EN_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** ja: 2026.07 / en: July 2026 */
export function formatMonthLabel(
  year: number,
  month: number,
  locale: AppLocale,
): string {
  if (locale === "ja") {
    return `${year}.${String(month).padStart(2, "0")}`;
  }
  return `${EN_MONTH_NAMES[month - 1]} ${year}`;
}