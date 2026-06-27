# 🥦 우리집 냉장고 (Greenbox)

<div align="center">

<img width="222" height="448" alt="Page-3" src="https://github.com/user-attachments/assets/2c8151ef-bf67-41a5-993f-b17c679ae82b" />
<img width="222" height="448" alt="Page-4" src="https://github.com/user-attachments/assets/19683eb4-67b3-4342-9a1a-3cc645903277" />


**집에 있는 식재료를 한눈에 관리해 식품 낭비를 줄이는 PWA**

[데모 보기](https://greenbox-seven.vercel.app)

</div>

## 1. 소개

**우리집 냉장고(Greenbox)** 는 냉장고 속 식재료와 유통기한을 관리해 식품 낭비를 줄이는 것을 목표로 하는 PWA 기반 웹 서비스입니다. 모바일 환경을 우선으로 설계했고, 홈 화면 설치 등 네이티브 앱에 가까운 경험을 제공합니다.

> ⚠️ 개인 학습용 사이드 프로젝트입니다. 현재 식재료 데이터는 목업(mock)과 브라우저 로컬 저장소(localStorage, IndexedDB)를 기반으로 동작하며, 백엔드 데이터베이스 연동은 진행 예정입니다. 아래 [구현한 기능](#-구현한-기능)과 [앞으로의 과제](#-앞으로의-과제)에서 현재 구현 범위를 정확히 구분해 적었습니다.

## 2. 성능 최적화: 약한 네트워크를 위한 설계

> 이 앱은 **마트에서 장을 보며** 사용합니다. 즉 약하고 불안정한 네트워크가 기본 사용 환경입니다. 그런데 정작 가장 느린 환경에서 가장 느렸습니다.

### 문제 - "가장 느린 네트워크에서 쓸 앱인데, 가장 무거운 초기 로딩"

Lighthouse(모바일 / Slow 4G) 베이스라인에서 병목은 전부 **초기 로딩**이었습니다. TBT, CLS는 양호했고, 느린 건 첫 화면이 뜨는 속도(LCP 6.2s)였습니다.

### 진단 - 코드 레벨 원인

번들을 분석하니, 차트 라이브러리 **recharts(약 343KB)가 분석 탭 한 곳에서만 쓰이는데도 모든 사용자의 첫 로드에 포함**되고 있었습니다. 정작 대부분의 사용자는 냉장고 탭만 봅니다.

### 개선 - `next/dynamic` 코드 스플리팅

해당 탭을 **실제로 열 때만** recharts가 로드되도록 분리했습니다. 분리된 청크도 Service Worker가 precache하므로 **오프라인 동작은 그대로 유지**됩니다.

### 결과 (Lighthouse, 모바일 / Slow 4G 동일 조건)

| 지표 | Before | After | 변화 |
|---|---|---|---|
| `/` First Load JS | 240 kB | **117 kB** | **−51%** |
| Performance | 62 | **72** | +10 |
| Largest Contentful Paint | 6.2s | **4.7s** | −24% |
| Speed Index | 7.2s | **4.9s** | −32% |
| Total Blocking Time | 50ms | **10ms** | −80% |

<div align="center">

<!-- 📸 여기에 Lighthouse before/after 캡처를 넣으세요 (나란히 2장) -->
<!-- 업로드 후 아래 두 줄의 src를 GitHub이 생성한 이미지 URL로 교체 -->

<table>
<tr>
<td align="center"><b>Before</b><br/>Performance 62</td>
<td align="center"><b>After</b><br/>Performance 72</td>
</tr>
<tr>
<td><img width="380" alt="Lighthouse before (mobile, Slow 4G)" src="" /></td>
<td><img width="380" alt="Lighthouse after (mobile, Slow 4G)" src="" /></td>
</tr>
</table>

</div>

> **다음 단계:** 번들을 걷어내자 가려져 있던 다음 병목(render-blocking ~1.8s)이 드러났습니다. *첫 방문은 초기 로딩 최적화로, 재방문은 Service Worker 캐싱으로* - 약한 네트워크를 두 겹으로 방어하는 방향으로 이어가고 있습니다.

## 3. 구현한 기능

현재 **실제로 동작하는** 기능입니다.

- 📱 **PWA / 오프라인 셸** - Service Worker가 앱 셸(JS, CSS, HTML)과 정적 이미지를 precache, 홈 화면 설치 지원
- 🛒 **장바구니 & 즐겨찾기** - `localStorage` 기반 로컬 영속화 (새로고침 후에도 유지)
- 📊 **구매/소비 분석** - `IndexedDB` 기반으로 실제 구매 행동(장바구니 "구매완료")을 누적 저장하고 통계 시각화 (Recharts, 코드 스플리팅으로 지연 로딩)
- ⚡ **초기 로딩 최적화** - 코드 스플리팅으로 메인 First Load JS −51% (위 [성능 최적화](#-성능-최적화-약한-네트워크를-위한-설계) 참조)

### 🟡 부분 구현

UI, 인터랙션은 동작하지만, 일부는 목업 데이터 또는 클라이언트 한정으로 동작합니다.

- 🧊 **냉장고 보드** - 추가/수정 등 인터랙션은 동작하나, 표시 데이터는 목업이며 영속화 미적용(새로고침 시 초기화)
- 🗓 **유통기한 알림** - 설정 UI + **클라이언트 로컬 알림**(앱이 열려 있을 때 `setInterval`로 체크해 브라우저 알림 발송). 서버 푸시는 아래 과제 참조
- 📊 **분석 품목 풀** - 구매 카운트는 실제 누적되지만, 분석 화면에 나열되는 품목 리스트 자체는 목업

## 4. 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **State**: React `useState` + Context API
- **Data Viz**: Recharts (지연 로딩)

### PWA & Local Data
- **PWA**: `@ducanh2912/next-pwa` (Next 15 호환, Workbox 기반 Service Worker)
- **로컬 저장소**: localStorage (장바구니, 즐겨찾기, 알림 설정), IndexedDB (구매 데이터)
- **푸시(부분)**: Web Push API, web-push, VAPID - *구독 저장, 서버 발송은 미완성, 과제 참조*

## 5. 시작하기

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

## 앞으로의 과제

이 프로젝트를 진행하며 만난, 아직 풀지 못한 문제들입니다. (계획 단계이며 미구현)

- **데이터 영속화 / 서버 연동** - 현재 목업 + 로컬 저장소(localStorage, IndexedDB) 단계이며, 백엔드 데이터베이스 연동은 미구현입니다. 냉장고 보드의 영속화도 이 작업과 함께 다룰 예정입니다.
- **서버 푸시 알림(end-to-end)** - VAPID 키 발급과 브라우저 구독까지는 동작하지만, 구독 정보 저장 → 서버 자동 발송으로 이어지는 흐름은 미완성입니다. 현재 알림은 앱이 열려 있을 때 동작하는 클라이언트 로컬 알림입니다. 구독 저장(DB)과 서버 스케줄러(cron) 연동이 과제입니다.
- **오프라인에서 변경한 데이터의 동기화** - 오프라인 셸까지는 동작하지만, 오프라인 중 발생한 변경을 재연결 시 안전하게 병합하는 부분은 아직 다루지 못했습니다. 실시간 협업, CRDT 같은 접근을 학습하며(오픈소스 yorkie에 기여한 경험이 있습니다) 이어서 고민하고 있습니다.
- **성능 2단계** - 번들 최적화 후 드러난 render-blocking(~1.8s) 개선(critical CSS, 폰트 로딩 전략)이 다음 단계입니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 연락처

**김현지**
- GitHub: [@hyunji1117](https://github.com/hyunji1117)

---

<div align="center">

Made with 🥦 by Greenbox

</div>