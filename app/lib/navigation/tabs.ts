// app/lib/navigation/tabs.ts
// 탭과 URL의 관계. 서버의 첫 렌더링과 브라우저가 같은 규칙으로 탭을 판단한다

import type { Tab } from '@/app/components/layout/BottomNavigation';

export function paramToTab(value: string | null): Tab {
  switch (value) {
    // 예전 "건강" 탭 주소(북마크, 알림 링크)는 통계 탭으로 연다
    case 'healthAnalysis':
      return 'stats';
    case 'stats':
    case 'fridge':
    case 'shoppingList':
    case 'ingredients':
    case 'settings':
      return value;
    default:
      return 'fridge';
  }
}

// 탭을 누를 때마다 서버에서 페이지를 다시 만들지 않도록 주소만 바꾼다.
// useSearchParams가 이 변경을 알려 주어 화면도 함께 바뀐다
export function goToTab(tab: Tab): void {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', tab);
  window.history.pushState(null, '', url);
}

// 지금 보고 있는 탭을 아래 메뉴에서 한 번 더 눌렀을 때 알린다 (2026-11-20)
// 냉장고 탭은 선반 목록에 들어가 있으면 냉장고 그림으로 돌아간다. 주소 기록은 새로 쌓지 않는다
const TAB_RESELECT_EVENT = 'greenbox:tab-reselect';

export function announceTabReselect(tab: Tab): void {
  window.dispatchEvent(
    new CustomEvent<Tab>(TAB_RESELECT_EVENT, { detail: tab }),
  );
}

export function onTabReselect(tab: Tab, handler: () => void): () => void {
  const listener = (event: Event) => {
    if ((event as CustomEvent<Tab>).detail === tab) handler();
  };
  window.addEventListener(TAB_RESELECT_EVENT, listener);
  return () => window.removeEventListener(TAB_RESELECT_EVENT, listener);
}
