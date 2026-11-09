# 우리집 냉장고 앱 (Expo)

운영 웹앱(https://greenbox-seven.vercel.app)을 웹뷰로 여는 모바일 앱입니다. 결정 기록: `docs/decisions/0011-mobile-webview-shell.md`

## 실행 (개발)

1. 폰에 **Expo Go** 앱을 설치합니다 (앱스토어, 플레이스토어)
2. 이 폴더에서 `npm install` 후 `npx expo start`
   - 배포 전 웹 화면을 확인할 때는 `EXPO_PUBLIC_WEB_URL=http://<맥 IP>:3033 npx expo start -c`로 맥의 개발 서버를 엽니다 (로그인이 필요 없는 화면만 확인할 수 있습니다)
3. 터미널에 나온 QR을 아이폰은 카메라로, 안드로이드는 Expo Go로 찍습니다 (폰과 컴퓨터가 같은 와이파이)

## 구조

- `App.tsx`: 웹뷰 셸 (안전 영역, 뒤로 가기, 외부 링크, 로딩과 오류, 메시지 받기)
- `src/bridge.ts`: 앱과 웹 메시지 규약 (`window.GreenboxApp`)
- `src/login.ts`: 시스템 브라우저 구글 로그인과 일회용 코드 넘겨받기
- `src/config.ts`: 웹 주소(`app.json`의 `extra.webUrl`)와 앱 정보

## 검사

- 타입: `npx tsc --noEmit`
- 설정과 의존성: `npx expo-doctor`
