"use client";

import Link from "next/link";

import {
  FAB_BASE_CLASS,
  FAB_BOTTOM_CLASS,
  FAB_LEFT_CLASS,
  FAB_GLASS_REFLECTION_STYLE,
  FAB_GLASS_STYLE,
  FAB_WHITE_SVG_SHADOW,
} from "@/components/archive/fabGlassStyles";

type ArchiveListFabProps = {
  href?: string;
};

function GridIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 22 22"
      fill="currentColor"
      aria-hidden
    >
      <rect x="2" y="2" width="4.5" height="4.5" rx="1" />
      <rect x="8.75" y="2" width="4.5" height="4.5" rx="1" />
      <rect x="15.5" y="2" width="4.5" height="4.5" rx="1" />
      <rect x="2" y="8.75" width="4.5" height="4.5" rx="1" />
      <rect x="8.75" y="8.75" width="4.5" height="4.5" rx="1" />
      <rect x="15.5" y="8.75" width="4.5" height="4.5" rx="1" />
      <rect x="2" y="15.5" width="4.5" height="4.5" rx="1" />
      <rect x="8.75" y="15.5" width="4.5" height="4.5" rx="1" />
      <rect x="15.5" y="15.5" width="4.5" height="4.5" rx="1" />
    </svg>
  );
}

export function ArchiveListFab({ href = "/" }: ArchiveListFabProps) {
  return (
    <Link
      href={href}
      aria-label="アーカイブ一覧へ戻る"
      className={`fixed ${FAB_LEFT_CLASS} ${FAB_BOTTOM_CLASS} ${FAB_BASE_CLASS}`}
      style={FAB_GLASS_STYLE}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={FAB_GLASS_REFLECTION_STYLE}
        aria-hidden
      />
      <span className="relative text-white" style={FAB_WHITE_SVG_SHADOW}>
        <GridIcon />
      </span>
    </Link>
  );
}
