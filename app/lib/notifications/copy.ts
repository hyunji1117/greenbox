// app/lib/notifications/copy.ts
// 알림 문구 A/B. 문구마다 사람과 날짜로 고정 배정해, 같은 사람도 날마다 두 문구를 번갈아 받게 한다
// (사람이 적어 사람별로 고정하면 "그 사람의 습관"과 "문구의 효과"가 섞이므로 날짜까지 섞는다)
// 문구 규칙: 겁주거나 재촉하지 않는다, 사실(품목과 기한)을 담는다, 감시처럼 느껴지는 표현(누가 넣었는지 등)은 쓰지 않는다

import type { PushMessage } from '@/app/lib/push/sendToUsers';

export type SummaryKind = 'daily' | 'weekly';
export const VARIANTS = ['A', 'B'] as const;
export type Variant = (typeof VARIANTS)[number];

// FNV-1a. 같은 입력이면 늘 같은 문구가 나오고, 문구가 고르게 나뉜다
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function assignVariant(
  userId: string,
  date: string,
  kind: SummaryKind,
): Variant {
  return VARIANTS[hash(`${userId}:${date}:${kind}`) % VARIANTS.length];
}

const subjectOf = (itemNames: string[]) => {
  const [first, ...rest] = itemNames;
  return rest.length > 0 ? `${first} 외 ${rest.length}개` : first;
};

// A: 지금까지 쓰던 안내형 / B: 오늘 할 일을 제안하는 질문형
const COPY: Record<
  SummaryKind,
  Record<Variant, (names: string[]) => { title: string; body: string }>
> = {
  daily: {
    A: names => ({
      title: '곧 먹어야 할 식재료가 있어요',
      body: `${subjectOf(names)}의 유통기한이 다가와요`,
    }),
    B: names => ({
      title: `오늘은 ${names[0]} 먼저 먹어 볼까요?`,
      body:
        names.length > 1
          ? `${subjectOf(names)}, 유통기한 전에 꺼내 두면 좋아요`
          : '유통기한 전에 꺼내 두면 좋아요',
    }),
  },
  weekly: {
    A: names => ({
      title: '다음 장보기 전에 먹어야 할 식재료',
      body: `장 보기 전에 확인해 보세요. ${subjectOf(names)}의 유통기한이 일주일 안에 끝나요`,
    }),
    B: names => ({
      title: '장 보러 가기 전에 냉장고 먼저 볼까요?',
      body: `${subjectOf(names)}, 일주일 안에 먹으면 같은 걸 또 사지 않아도 돼요`,
    }),
  },
};

// 알림을 누르면 냉장고 탭이 열리고, 어떤 알림이었는지 주소로 알려 열기 기록을 남긴다
export function summaryUrl(
  kind: SummaryKind,
  variant: Variant,
  period: string,
): string {
  const params = new URLSearchParams({
    tab: 'fridge',
    from: 'push',
    kind,
    v: variant,
    d: period,
  });
  return `/?${params.toString()}`;
}

export function buildSummary(
  kind: SummaryKind,
  itemNames: string[],
  variant: Variant = 'A',
  period?: string,
): PushMessage {
  const { title, body } = COPY[kind][variant](itemNames);
  return period
    ? { title, body, url: summaryUrl(kind, variant, period) }
    : { title, body };
}
