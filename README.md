# 🥦 우리집 냉장고 - 스마트 식재료 관리 서비스

<div align="center">
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
  
  **AI와 가족 협업으로 제로 웨이스트를 실현하는 스마트 홈의 시작**
  
  [데모 보기](https://greenbox.vercel.app) • [wiki](https://github.com/hyunji1117/greenbox/wiki) • [버그 신고](mailto:eve0204eve@gmail.com)

</div>

## 📌 소개

**우리집 냉장고**는 가족이 함께 사용하는 냉장고를 스마트하게 관리하여 식품 낭비를 줄이는 PWA 기반 웹 서비스입니다. 매년 버려지는 20만원 상당의 식재료를 구제하고, 가족이 함께 참여하는 지속 가능한 소비 문화를 만들어갑니다.

### ✨ 주요 특징

- 🤖 **AI 자동 인식** - 사진 한 장으로 식재료와 유통기한 자동 등록
- 👨‍👩‍👧‍👦 **실시간 가족 공유** - 중복 구매 방지 및 실시간 동기화
- 🎮 **게이미피케이션** - 포인트, 뱃지, 챌린지로 재미있는 관리
- 📱 **PWA 네이티브** - 오프라인 지원, 푸시 알림, 홈 화면 설치
- 🍳 **스마트 레시피** - 유통기한 임박 식재료 활용 레시피 추천

## 🚀 시작하기

### 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Supabase 계정 (무료)

### 설치

```bash
# 레포지토리 클론
git clone https://github.com/hyunji1117/greenbox.git
cd greenbox

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 필요한 API 키 입력

# 개발 서버 실행
npm run dev
```

개발 서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

### 환경 변수 설정

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Vision API
GOOGLE_VISION_API_KEY=your_google_vision_api_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State**: Zustand, TanStack Query v5
- **PWA**: Service Worker, IndexedDB

### AI/ML
- **Computer Vision**: TensorFlow.js, Google Vision API
- **Natural Language**: OpenAI API
- **Image Processing**: Canvas API, WebGL

### Backend & Data
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime, WebSocket
- **Caching**: React Query, LocalStorage

## 📱 주요 기능

### AI 자동 입력
- 사진 촬영으로 식재료 자동 인식
- OCR 기반 유통기한 자동 추출
- 인식률 94% 달성

### 실시간 동기화
- CRDT 기반 충돌 해결
- 오프라인 지원 (95% 사용 가능)
- 평균 동기화 지연 150ms

### 알림 시스템
- D-7, D-3, D-Day 3단계 알림
- 가족 구성원별 맞춤 알림
- 푸시 알림 도달률 98%

### 게이미피케이션
- 포인트 & 뱃지 시스템
- 가족 챌린지 & 리더보드
- 월간 리포트 & 절약 금액 시각화

## 📊 성과

| 지표 | 성과 |
|-----|-----|
| **일일 활성 사용자** | 1,450명 |
| **식품 폐기 감소** | 58% |
| **월간 평균 절약액** | 14만원 |
| **앱스토어 평점** | ⭐ 4.6/5.0 |
| **Lighthouse 점수** | 98/100 |

## 🤝 기여하기

프로젝트에 기여하고 싶으신가요? 모든 기여를 환영합니다!

1. 프로젝트를 Fork 하세요
2. Feature 브랜치를 생성하세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 열어주세요

자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조해주세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조해주세요.

## 📞 연락처

**김현지** - Product Owner
- GitHub: [@hyunji1117](https://github.com/hyunji1117)
- Slack: [#evelynkim-slack](https://evelynkim.slack.com/team/U09ELNXBE2G)

**프로젝트 링크**: [https://github.com/hyunji1117/greenbox](https://github.com/hyunji1117/greenbox)

---

<div align="center">
  
  Made with ❤️ by GreenBox
  
  <sub>Last Updated: 2025-09-20</sub>
  
</div>