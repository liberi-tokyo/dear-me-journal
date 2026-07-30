/**
 * 保存・取得パイプラインの計測。
 * Safari リモート検査でも見られるよう、常に console へ出す。
 */
const PREFIX = "[DearMe:perf]";

export function perfStart(label: string): string {
  const key = `${PREFIX} ${label}`;
  console.time(key);
  return key;
}

export function perfEnd(key: string): void {
  console.timeEnd(key);
}

export async function perfMeasure<T>(
  label: string,
  work: () => Promise<T>,
): Promise<T> {
  const key = perfStart(label);
  try {
    return await work();
  } finally {
    perfEnd(key);
  }
}

export function perfLog(label: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.info(PREFIX, label, detail);
  } else {
    console.info(PREFIX, label);
  }
}
