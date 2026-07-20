type ColorSwatchProps = {
  color: string;
  onSelect: (color: string) => void;
  selected?: boolean;
};

export function ColorSwatch({
  color,
  onSelect,
  selected = false,
}: ColorSwatchProps) {
  return (
    <button
      type="button"
      aria-label={`色 ${color}`}
      aria-pressed={selected}
      onClick={() => onSelect(color)}
      className={`min-h-11 min-w-11 size-11 touch-manipulation rounded-full border transition-transform active:scale-90 ${
        selected
          ? "border-stone-700 ring-2 ring-stone-700/25 ring-offset-2"
          : "border-stone-200/80"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}
