"use client";

import Link from "next/link";

import {
  FAB_BASE_CLASS,
  FAB_BOTTOM_CLASS,
  FAB_GLASS_REFLECTION_STYLE,
  FAB_GLASS_STYLE,
  FAB_RIGHT_CLASS,
  FAB_WHITE_ICON_SHADOW,
} from "@/components/archive/fabGlassStyles";

type ArchiveFabProps = {
  href?: string;
};

export function ArchiveFab({ href = "/compose" }: ArchiveFabProps) {
  return (
    <Link
      href={href}
      aria-label="新しい日記を書く"
      className={`fixed ${FAB_RIGHT_CLASS} ${FAB_BOTTOM_CLASS} ${FAB_BASE_CLASS}`}
      style={FAB_GLASS_STYLE}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={FAB_GLASS_REFLECTION_STYLE}
        aria-hidden
      />
      <span
        aria-hidden
        className="relative font-outfit-black -mt-0.5 text-[3.5rem] leading-none text-white"
        style={FAB_WHITE_ICON_SHADOW}
      >
        +
      </span>
    </Link>
  );
}
