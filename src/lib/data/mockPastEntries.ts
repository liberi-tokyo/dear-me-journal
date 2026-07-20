import type { PastEntryDisplay } from "@/lib/types/pastEntry";

/** 過去日記表示モック用のダミーデータ */
export const MOCK_PAST_ENTRIES: PastEntryDisplay[] = [
  {
    id: "past-1",
    entryDate: "2026-06-05",
    body: "公園でブランコ。風が気持ちよかった。帰り道、アイスを買ってもらった。",
    color: "#90BE6D",
    photoUrl: "https://picsum.photos/seed/past-jun05/400",
  },
  {
    id: "past-2",
    entryDate: "2025-07-05",
    body: "1年前の今日。初めて自転車に乗れた。倒れても泣かなかった。",
    color: "#FFD166",
  },
  {
    id: "past-3",
    entryDate: "2024-07-05",
    body: "2年前。雨の日。窓の外をずっと見ていた。ポツポツと音がした。",
    color: "#118AB2",
    photoUrl: "https://picsum.photos/seed/past-jul05-2024/400",
  },
  {
    id: "past-4",
    entryDate: "2026-03-12",
    body: "お花見に行った。桜の下でおにぎりを食べた。",
    color: "#F4A261",
  },
  {
    id: "past-5",
    entryDate: "2025-11-08",
    body: "紅葉がきれいだった。落ち葉を集めて、お母さんにプレゼントした。",
    color: "#E76F51",
    photoUrl: "https://picsum.photos/seed/past-nov08/400",
  },
];
