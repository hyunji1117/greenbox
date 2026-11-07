// app/lib/app/version.ts
// 화면에 보여 줄 앱 버전. 빌드할 때 next.config.mjs가 package.json의 version과 배포 커밋을 넣는다
// 사용자에게는 버전 숫자만 보이고, 배포 커밋은 개발자 모드(버전 5번 누르기)에서만 함께 보인다

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT ?? '';

// 기본 "1.2.0", 개발자 모드 "1.2.0 (b4d0d43)". 로컬처럼 커밋을 모르면 버전만
export const appVersionLabel = (withCommit = false) =>
  withCommit && APP_COMMIT ? `${APP_VERSION} (${APP_COMMIT})` : APP_VERSION;
