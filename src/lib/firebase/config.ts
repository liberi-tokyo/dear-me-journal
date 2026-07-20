const firebaseEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

/**
 * Next.js はクライアントバンドルで process.env.NEXT_PUBLIC_* を
 * 静的なプロパティアクセスのときだけ文字列に置換する。
 * process.env[key] のような動的アクセスはクライアントで常に undefined になる。
 */
function readFirebaseEnv(): {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
} {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  return {
    apiKey: apiKey && apiKey.length > 0 ? apiKey : undefined,
    authDomain: authDomain && authDomain.length > 0 ? authDomain : undefined,
    projectId: projectId && projectId.length > 0 ? projectId : undefined,
    storageBucket:
      storageBucket && storageBucket.length > 0 ? storageBucket : undefined,
    messagingSenderId:
      messagingSenderId && messagingSenderId.length > 0
        ? messagingSenderId
        : undefined,
    appId: appId && appId.length > 0 ? appId : undefined,
  };
}

export function getFirebaseConfig(): FirebaseConfig | null {
  const {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  } = readFirebaseEnv();

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

export function getMissingFirebaseEnvKeys(): string[] {
  const env = readFirebaseEnv();
  const values: Record<(typeof firebaseEnvKeys)[number], string | undefined> =
    {
      NEXT_PUBLIC_FIREBASE_API_KEY: env.apiKey,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: env.authDomain,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: env.projectId,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: env.storageBucket,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: env.messagingSenderId,
      NEXT_PUBLIC_FIREBASE_APP_ID: env.appId,
    };

  return firebaseEnvKeys.filter((key) => !values[key]);
}
