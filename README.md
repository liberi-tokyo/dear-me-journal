# 毎月日記

子どもでも使えるほどシンプルで、大人も使える日記アプリ。  
コンセプトは「投稿したら過去が返ってくる」「思い出が報酬」。

## 技術スタック

- Next.js (App Router) / TypeScript / Tailwind CSS
- Firebase Auth（Google ログイン）
- Cloud Firestore（`users/{uid}/entries/{entryId}`）
- Firebase Storage（`users/{uid}/entries/{entryId}/image`）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** → Sign-in method → **Google** を有効化
3. **Firestore Database** を作成（本番モードで開始し、ルールをデプロイ）
4. **Storage** を有効化し、ルールをデプロイ
5. **Project settings** → **Your apps** → Web アプリを追加し、設定値を取得
6. Authentication → Settings → Authorized domains に開発用ホストを追加（必要に応じて）

### 3. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` に Firebase の設定値を記入してください。

### 4. Security Rules / Indexes のデプロイ

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 5. 開発サーバー

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

### 6. iPhone 実機テスト（同一 Wi‑Fi）

Mac と iPhone を同じ Wi‑Fi に接続し、LAN 経由で開発サーバーを開きます。

1. Mac の IP アドレスを確認する

```bash
ipconfig getifaddr en0
```

（Wi‑Fi が `en1` の場合は `en1` に変更）

2. `.env.local` に次を追加する（IP は手順1の値に置き換え）

```bash
DEV_LAN_ORIGIN=192.168.x.x:3000
```

Next.js 16 では、iPhone から `/_next/*` を読み込むために `allowedDevOrigins` が必要です。

3. LAN 向け開発サーバーを起動する

```bash
npm run dev:lan
```

4. iPhone の Safari で開く

```
http://192.168.x.x:3000
```

**確認フロー（実機）**

1. アーカイブ → ＋で新規投稿 → 本文入力 → 色選択 → 確定
2. 投稿後画面で今日のカード → 下スクロールで過去日記
3. 左下ボタンでアーカイブへ → 設定（歯車）→ 問いかけ変更・トグル確認
4. 再度投稿して設定反映を確認

**実機で見るポイント**

- ノッチ / ホームインジケータと FAB（左下・右下）の干渉
- `100dvh` とキーボード表示時のスクロール
- textarea フォーカス時の意図しないズーム（16px 未満入力を回避済み）
- カラーサークルタップで標準カラーピッカーが開くこと
- 色は「この色にする」確定時のみ履歴保存（最近使った色・最大12色）

## プロジェクト構成

```
src/
├── app/                 # App Router ページ
├── components/          # UI コンポーネント
├── contexts/            # React Context（Auth など）
└── lib/
    ├── firebase/        # Firebase 初期化・定数
    └── types/           # 型定義
firebase/
├── firestore.rules
└── storage.rules
```

## 仕様メモ（MVP）

- **認証**: Google ログイン（1アカウント = 1冊の日記）
- **1日1投稿**: 同日に再投稿すると既存日記を更新
- **写真**: 1投稿1枚（任意）
- **日付**: Asia/Tokyo の暦日
- **PWA / Vercel**: 未対応（次フェーズ）

## スクリプト

| コマンド        | 説明           |
| --------------- | -------------- |
| `npm run dev`   | 開発サーバー   |
| `npm run dev:lan` | 同一 Wi‑Fi 内の実機からアクセス可能な開発サーバー |
| `npm run build` | 本番ビルド     |
| `npm run start` | 本番サーバー   |
| `npm run lint`  | ESLint         |
