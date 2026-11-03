// app/lib/navigation/tabs.ts
// 탭과 URL의 관계. 서버의 첫 렌더링과 브라우저가 같은 규칙으로 탭을 판단한다

import type { Tab } from '@/app/components/layout/BottomNavigation';

export function paramToTab(value: string | null): Tab {
  switch (value) {
    case 'healthAnalysis':
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
