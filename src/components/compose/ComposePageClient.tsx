"use client";

import { ComposeFlow } from "@/components/compose/ComposeFlow";

type ComposePageClientProps = {
  initialDate?: string;
  debugColor?: boolean;
};

export function ComposePageClient({
  initialDate,
  debugColor = false,
}: ComposePageClientProps) {
  return <ComposeFlow initialDate={initialDate} debugColor={debugColor} />;
}
