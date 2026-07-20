/** Firebase Auth エラーをユーザー向け日本語に変換 */
export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "ログインがキャンセルされました";
    case "auth/popup-blocked":
      return "ポップアップがブロックされました。ブラウザの設定を確認してください";
    case "auth/network-request-failed":
      return "ネットワークエラーです。接続を確認してください";
    case "auth/unauthorized-domain":
      return "このドメインからのログインは許可されていません";
    case "auth/operation-not-allowed":
      return "Googleログインが有効になっていません。Firebase Consoleを確認してください";
    case "auth/account-exists-with-different-credential":
      return "別の方法で登録済みのアカウントです";
    case "auth/too-many-requests":
      return "しばらく時間をおいてから再度お試しください";
    case "auth/user-disabled":
      return "このアカウントは無効になっています";
    case "auth/internal-error":
      return "認証処理でエラーが発生しました。しばらくしてから再度お試しください";
    default:
      return "ログインに失敗しました。もう一度お試しください";
  }
}
