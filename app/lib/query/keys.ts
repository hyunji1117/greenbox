// app/lib/query/keys.ts
// 쿼리 키를 한곳에서 만든다. 키가 계층 구조라서 itemKeys.all로 무효화하면 하위가 모두 무효화된다.
// 품목 목록 키에 냉장고 번호를 넣어, 냉장고를 바꿔도 다른 냉장고 품목이 화면에 섞이지 않게 한다

export const itemKeys = {
  all: ['items'] as const,
  list: (fridgeId: string) => [...itemKeys.all, 'list', fridgeId] as const,
};

export const fridgeKeys = {
  all: ['fridges'] as const,
  current: () => [...fridgeKeys.all, 'current'] as const,
  mine: () => [...fridgeKeys.all, 'mine'] as const,
  invite: (fridgeId: string) =>
    [...fridgeKeys.all, 'invite', fridgeId] as const,
  requests: (fridgeId: string) =>
    [...fridgeKeys.all, 'requests', fridgeId] as const,
};
