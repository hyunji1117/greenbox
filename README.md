# 🥦 우리집 냉장고 (Greenbox)

<div align="center">

<img width="222" height="448" alt="Page-3" src="https://github.com/user-attachments/assets/2c8151ef-bf67-41a5-993f-b17c679ae82b" />
<img width="222" height="448" alt="Page-4" src="https://github.com/user-attachments/assets/19683eb4-67b3-4342-9a1a-3cc645903277" />


**집에 있는 식재료를 한눈에 관리해 식품 낭비를 줄이는 PWA**

[데모 보기](https://greenbox.vercel.app)

</div>

## 📌 소개

**우리집 냉장고(Greenbox)** 는 냉장고 속 식재료와 유통기한을 관리해 식품 낭비를 줄이는 것을 목표로 하는 PWA 기반 웹 서비스입니다. 모바일 환경을 우선으로 설계했고, 홈 화면 설치와 푸시 알림 등 네이티브 앱에 가까운 경험을 제공합니다.

> ⚠️ 개인 학습용 사이드 프로젝트입니다. 현재 식재료 데이터는 목업(mock) 데이터를 기반으로 동작하며, 별도의 백엔드 데이터베이스 연동은 진행 중입니다.

## ✨ 구현한 기능

- 📱 **PWA** — Service Worker 기반 설치/오프라인 셸, 홈 화면 추가 지원
- 🔔 **웹 푸시 알림** — `web-push` + VAPID 기반 알림 발송, 유통기한 임박 알림 스케줄링
- 🧊 **냉장고 보드** — 카테고리별 식재료/유통기한 관리 UI
- 🛒 **장바구니 & 즐겨찾기** — `localStorage` 기반 로컬 영속화
- 📊 **구매/소비 분석** — `IndexedDB` 기반 구매 데이터 저장 및 통계 시각화 (Recharts)
- 🗓 **유통기한 알림 설정** — D-day 기준 알림 시점 커스터마이즈

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State**: Zustand, TanStack Query v5, React Context

### PWA & Local Data
- **PWA**: next-pwa (Service Worker)
- **로컬 저장소**: localStorage (장바구니·즐겨찾기·알림 설정), IndexedDB (구매 데이터)
- **푸시 알림**: Web Push API, web-push, VAPID

## 🚀 시작하기

### 요구사항
- Node.js 20 이상
- npm

### 설치 및 실행

```bash
# 레포지토리 클론
git clone https://github.com/hyunji1117/greenbox.git
cd greenbox

# 의존성 설치
npm install

# 환경 변수 설정 (푸시 알림 사용 시)
# .env.local 파일에 VAPID 키 입력

# 개발 서버 실행
npm run dev
```

개발 서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

### 환경 변수 (웹 푸시 알림용)

```env
# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@example.com
```

## 🧭 앞으로의 과제

이 프로젝트를 진행하며 만난, 아직 풀지 못한 문제들입니다.

- **데이터 영속화 / 서버 연동** — 현재 목업 + 로컬 저장소(localStorage·IndexedDB) 단계이며, 백엔드 데이터베이스 연동은 미구현입니다.
- **오프라인에서 변경한 데이터의 동기화** — 오프라인 셸까지는 동작하지만, 오프라인 중 발생한 변경을 재연결 시 안전하게 병합하는 부분은 아직 다루지 못했습니다. 실시간 협업·CRDT 같은 접근을 학습하며 이어서 고민하고 있습니다.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

**김현지**
- GitHub: [@hyunji1117](https://github.com/hyunji1117)

---

<div align="center">

Made with 🥦 by Greenbox

</div>
