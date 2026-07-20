import { ComposePageClient } from "@/components/compose/ComposePageClient";

type ComposePageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function ComposePage({ searchParams }: ComposePageProps) {
  const { date } = await searchParams;
  return <ComposePageClient initialDate={date} />;
}
