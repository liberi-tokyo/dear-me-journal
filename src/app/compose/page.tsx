import { ComposePageClient } from "@/components/compose/ComposePageClient";

type ComposePageProps = {
  searchParams: Promise<{ date?: string; debugColor?: string }>;
};

export default async function ComposePage({ searchParams }: ComposePageProps) {
  const { date, debugColor } = await searchParams;
  return (
    <ComposePageClient
      initialDate={date}
      debugColor={debugColor === "1"}
    />
  );
}
