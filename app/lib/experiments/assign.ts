// app/lib/experiments/assign.ts
// 실험 배정의 공용 기반. 같은 입력이면 늘 같은 변형이 나오고, 변형이 고르게 나뉜다
// 알림 문구 A/B(app/lib/notifications/copy.ts)와 선반 보기 베타가 같은 함수를 쓴다
// 해시나 입력 문자열을 바꾸면 진행 중인 실험의 배정이 바뀌므로 assign.test.ts의 고정값으로 막는다

// FNV-1a 32비트
export function hashText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// 배정 단위 문자열(예: "사람:날짜:종류")로 변형 하나를 고른다
export function pickVariant<V extends string>(
  unitKey: string,
  variants: readonly V[],
): V {
  if (variants.length === 0) throw new Error('변형이 없습니다');
  return variants[hashText(unitKey) % variants.length];
}
