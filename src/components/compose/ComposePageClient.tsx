"use client";

import { ComposeFlow } from "@/components/compose/ComposeFlow";

type ComposePageClientProps = {
  initialDate?: string;
};

export function ComposePageClient({ initialDate }: ComposePageClientProps) {
  return <ComposeFlow initialDate={initialDate} />;
}
