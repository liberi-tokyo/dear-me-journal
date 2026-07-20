/** 新規投稿・日付変更時の本文初期値を決定する */
export function resolveComposeBody(
  mode: "create" | "edit",
  existingBody: string,
  prompt: string,
  usePromptAsTemplate: boolean,
): string {
  if (mode === "edit" && existingBody) {
    return existingBody;
  }

  if (mode === "create" && usePromptAsTemplate) {
    return prompt;
  }

  return "";
}
