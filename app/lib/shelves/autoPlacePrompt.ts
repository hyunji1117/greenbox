// app/lib/shelves/autoPlacePrompt.ts
// 선반 보기 소개(AutoPlaceCheck)를 언제 띄울지 기기에 기억한다
// - 본 기록: 사람마다 한 번 (신규 고객이든 목록 보기를 쓰던 기존 사용자든)
// - 다시 띄우기: 정식 적용 전 베타 동안에는 선반 보기 스위치를 켤 때마다 다시 띄운다 (2026-11-20)
//   정식 적용 뒤에는 스위치가 사라지므로 이 경로도 자연히 쓰이지 않는다
// 소개가 끝나야 선반 둘러보기가 시작되고, 둘러보기가 끝나야 밀어서 닫기, 알림장 안내가 이어진다

const seenKey = (userId: string) => `greenbox_auto_place_prompt_seen_${userId}`;
// 베타를 켰을 때 남긴다 (누가 켰든 이 기기에서 다시 보게)
const AGAIN_KEY = 'greenbox_auto_place_prompt_again';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readPromptState(userId: string): {
  seen: boolean;
  again: boolean;
} {
  try {
    const store = storage();
    return {
      seen: store?.getItem(seenKey(userId)) === '1',
      again: store?.getItem(AGAIN_KEY) === '1',
    };
  } catch {
    // 저장소를 막은 브라우저에서는 매번 뜨지 않도록 띄우지 않는다 (점선과 카드 확정은 그대로)
    return { seen: true, again: false };
  }
}

// 소개를 끝까지 봤는지 (둘러보기가 이걸 기다린다)
export function isIntroDone(userId: string): boolean {
  const { seen, again } = readPromptState(userId);
  return seen && !again;
}

export function savePromptDone(userId: string): void {
  try {
    storage()?.setItem(seenKey(userId), '1');
    storage()?.removeItem(AGAIN_KEY);
  } catch {
    // 저장하지 못해도 이번 화면에서는 닫힌 상태로 둔다
  }
}

// 선반 보기를 켰을 때 부른다. 다음에 냉장고를 열면 소개가 다시 뜬다
export function requestPromptAgain(): void {
  try {
    storage()?.setItem(AGAIN_KEY, '1');
  } catch {
    // 저장하지 못하면 다시 띄우지 않는다
  }
}
