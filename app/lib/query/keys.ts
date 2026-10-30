// app/lib/query/keys.ts
// 쿼리 키를 한곳에서 만든다. 키가 계층 구조라서 itemKeys.all로 무효화하면 하위가 모두 무효화된다.

export const itemKeys = {
  all: ['items'] as const,
  list: () => [...itemKeys.all, 'list'] as const,
};
