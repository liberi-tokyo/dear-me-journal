import { DayGrid } from "@/components/archive/DayGrid";
import type { ArchiveDayEntry } from "@/lib/types/archive";
import type { AppLocale } from "@/lib/types/locale";
import { buildMonthGrid } from "@/lib/utils/date";
import { formatMonthLabel } from "@/lib/utils/locale";

type MonthSectionProps = {
  year: number;
  month: number;
  entries: ArchiveDayEntry[];
  locale: AppLocale;
};

export function MonthSection({ year, month, entries, locale }: MonthSectionProps) {
  const entriesByDate = new Map(entries.map((entry) => [entry.entryDate, entry]));
  const cells = buildMonthGrid(year, month, entriesByDate);
  const monthLabel = formatMonthLabel(year, month, locale);

  return (
    <section className="w-full min-w-0 scroll-mt-20 lg:max-w-[19.5rem]">
      <h2 className="m-0 pl-4 text-[13px] leading-none font-bold tracking-normal text-[#111111]">
        {monthLabel}
      </h2>
      <div className="mt-7">
        <DayGrid cells={cells} />
      </div>
    </section>
  );
}
