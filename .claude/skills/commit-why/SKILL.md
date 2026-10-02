---
name: commit-why
description: /commit-why 호출 또는 커밋, PR 초안 요청 시 사용. 커밋과 PR에 "무엇을"보다 "왜"를 먼저 남긴다.
---

# commit-why

목적: 커밋과 PR에 "무엇을"보다 "왜"를 먼저 남긴다.
나중에 이력을 읽는 사람(리뷰어, 채용 담당자)이 변경 이유를 커밋만 보고 이해할 수 있어야 한다.

## 1) 변경 수집

- `git status` / `git diff --stat` / `git diff`만 사용한다. `git log` 등 이력 참조 금지.
  - 이미 만든 커밋의 메시지를 다시 쓸 때는 대상 커밋의 `git show`(diff)만 본다.
- 서로 다른 작업이 섞여 있으면 멈추고 분리 여부를 묻는다.
- 영역이 불명확하면 먼저 묻는다.

## 2) "왜" 확보

- 이번 세션 대화에서 이유(문제, 요청, 제약)를 찾는다.
- 대화에 없으면 지어내지 말고 한 줄로 질문한다.
- diff에서 추론한 이유를 쓸 때는 "diff에서 추론했다"고 밝히고 확인을 받는다.

## 3) 커밋 메시지

### 제목

- 형식: `[TYPE | 영역] 제목`
- 50자 이내, 마침표 금지, 추상어(수정/변경/작업) 금지
- TYPE 우선순위: FIX > FEAT > REFACT > STYLE > CHORE > DOCS > TEST
  (한 커밋에 여러 성격이 있으면 순위가 높은 쪽)

### 본문

- `- ` 목록 3줄 이내
- 순서: 왜(문제/배경) → 무엇을 → 의도(확장/주의)
- "왜:" 같은 라벨 금지
- 줄마다 활용된 동사 최소 1개, 명사형 종결(발생/연결/고려/대비)
- -다/-함 종결 금지, 마침표 금지
- 한 줄 72자 이내, 나열 구분자는 `/`
- 3줄에 안 담기면 커밋 분리를 제안한다
- Co-Authored-By 등 AI 공동작성 표기 금지

### 공통 표기

- 가운뎃점(U+00B7) 금지 (커밋, PR, 커밋되는 코드 주석 모두). `와/과` 또는 `/`로 쓴다.

### 예시

```
[FEAT | DB] 동의 증빙을 위한 사용자와 동의 기록 저장소 추가

- 구글 로그인 도입 후 누가 언제 어떤 방침에 동의했는지 증명할 기록이 없는 문제 발생
- Auth.js 어댑터가 요구하는 테이블 4개와 동의 기록 테이블을 서울 리전 DB에 연결
- 앱 계정이 기록을 고치거나 지우면 증빙이 무너지므로 추가와 조회만 허용해 위변조에 대비
```

## 4) PR 본문

```
## 왜
## 무엇을
## 확인한 것
## 주의할 점
```

- PR 제목도 커밋 제목 형식(`[TYPE | 영역] 제목`)을 따른다.
- "확인한 것"에는 실제로 확인한 것만 적는다.
- "주의할 점"이 없으면 "없음"으로 적는다.
- AI 생성 표기 금지.

## 5) 실행 전 확인

- 커밋 대상 파일과 메시지 전문을 먼저 보여주고, 규칙 점검 결과를 함께 적은 뒤 멈춘다.
- 승인 후에만 `git commit`을 실행한다.
- PR 생성은 별도로 승인받는다.
- `git push`는 요청이 있을 때만 한다.

## 영역 목록

| 영역 | 범위 |
|---|---|
| AUTH | 로그인, 세션, 동의 화면 (`app/components/auth`, `app/lib/consent`, `auth.ts`) |
| DB | 스키마, 마이그레이션, DB 연결 (`db/`, `app/lib/db.ts`) |
| LAYOUT | 반응형, 타이포그래피, 공통 레이아웃 (`app/globals.css`, `app/components/layout`) |
| FRIDGE | 냉장고 화면 (`app/components/fridge`) |
| INGREDIENTS | 식재료 화면 (`app/components/ingredients`) |
| ANALYSIS | 건강 분석 화면 (`app/components/analysis`) |
| GROCERY | 장보기 목록 (`app/components/grocery-list`) |
| SETTINGS | 설정 화면 (`app/components/settings`) |
| NOTIFICATION | 푸시 알림, 서비스워커 알림 (`app/components/notification`, `worker/`) |
| PWA | 설치, 매니페스트, 서비스워커 빌드 |
| PRIVACY | 개인정보처리방침 (`app/privacy`) |
| BRAND | 앱 이름, 로고, 매니페스트 표기 (`app/lib/brand.ts`, `public/manifest.json`) |
| DOCS | README, 결정 기록 (`docs/`) |

목록에 없는 영역이 필요하면 먼저 묻고 이 표에 추가한다.
