import { EntryDetailView } from "@/components/entry/EntryDetailView";
import type { EntryDate } from "@/lib/types/entry";

type EntryPageProps = {
  params: Promise<{ date: string }>;
};

export default async function EntryPage({ params }: EntryPageProps) {
  const { date } = await params;
  return <EntryDetailView entryDate={date as EntryDate} />;
}
