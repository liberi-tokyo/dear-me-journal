import { DayCell } from "@/components/archive/DayCell";
import type { MonthGridCell } from "@/lib/types/archive";

type DayGridProps = {
  cells: MonthGridCell[];
};

export function DayGrid({ cells }: DayGridProps) {
  return (
    <div className="grid w-full grid-cols-7 gap-px md:gap-0.5 lg:gap-1">
      {cells.map((cell, index) => (
        <DayCell
          key={cell.entryDate ?? `empty-${index}`}
          cell={cell}
        />
      ))}
    </div>
  );
}
