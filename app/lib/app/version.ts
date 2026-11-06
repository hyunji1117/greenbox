// app/lib/app/version.ts
// 화면에 보여 줄 앱 버전. 빌드할 때 next.config.mjs가 package.json의 version과 배포 커밋을 넣는다

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT ?? '';

// "1.1.0 (bf3628b)". 로컬처럼 커밋을 모르면 버전만
export const appVersionLabel = () =>
  APP_COMMIT ? `${APP_VERSION} (${APP_COMMIT})` : APP_VERSION;
