// app/lib/testing/guideTest.ts
// 가이드 테스트: 테스트 계정이 아래 메뉴의 탭을 골라 그 탭의 안내를 다시 본다
// - 안내마다 "본 적 있음"을 이 기기 저장소에 남기므로, 고른 탭의 기록만 지우고 그 탭을 새로 연다
// - 가이드 테스트가 켜진 동안에는 이 기기에서 GA4로 아무것도 보내지 않는다 (app/lib/analytics/gtag.ts)
// 새 안내를 만들면 아래 GUIDE_PAGES에 저장소 키 앞부분을 더한다

import type { Tab } from '@/app/components/layout/BottomNavigation';

export const GUIDE_TEST_KEY = 'greenbox_guide_test_on';

export interface GuidePage {
  tab: Tab;
  label: string;
  // 이 페이지에서 뜨는 안내 제목 (화면에 함께 보여 준다)
  guides: string[];
  // 안내마다 "본 적 있음"을 남기는 저장소 키의 앞부분
  keyPrefixes: string[];
}

// 아래 메뉴의 탭 순서 그대로. 안내가 없는 탭은 guides가 비어 있고, 가이드 테스트 화면에서 "안내 없음"으로 보인다
export const GUIDE_PAGES: GuidePage[] = [
  { tab: 'ingredients', label: '홈', guides: [], keyPrefixes: [] },
  {
    tab: 'fridge',
    label: '냉장고',
    guides: [
      '냉장고 바꾸기',
      '함께 보는 사람',
      '새 구성원 참여',
      '알림장 등장',
      '밀어서 닫기',
      '예전 식재료 배치',
      '선반 둘러보기',
    ],
    keyPrefixes: [
      'greenbox_guide_members_count_seen_',
      'greenbox_guide_fridge_switch_seen_',
      'greenbox_owner_guide_seen_',
      'greenbox_guide_shelf_',
      // 정식 전환 안내 (AutoPlaceCheck). 앱이 넣어 둔 식재료가 있을 때만 뜬다
      'greenbox_auto_place_prompt_seen_',
    ],
  },
  { tab: 'shoppingList', label: '리스트', guides: [], keyPrefixes: [] },
  { tab: 'stats', label: '통계', guides: [], keyPrefixes: [] },
  { tab: 'settings', label: '마이', guides: [], keyPrefixes: [] },
];

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isGuideTestOn(): boolean {
  try {
    return storage()?.getItem(GUIDE_TEST_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveGuideTestOn(on: boolean): void {
  try {
    if (on) storage()?.setItem(GUIDE_TEST_KEY, '1');
    else storage()?.removeItem(GUIDE_TEST_KEY);
  } catch {
    // 저장소를 막은 브라우저는 켤 수 없다
  }
}

// 고른 페이지의 안내 기록을 지운다. 지운 키 수를 돌려준다
export function resetGuides(pages: GuidePage[]): number {
  const store = storage();
  if (!store) return 0;
  const prefixes = pages.flatMap(page => page.keyPrefixes);
  const keys: string[] = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key && prefixes.some(prefix => key.startsWith(prefix))) keys.push(key);
  }
  keys.forEach(key => store.removeItem(key));
  return keys.length;
}
