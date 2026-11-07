// app/lib/consent/privacyLink.ts
// 개인정보처리방침 링크. 바뀐 방침에 다시 동의할 때는 마지막으로 동의한 뒤 바뀐 글자를 빨간색으로 보이게 연다

export function privacyLink(changedSince?: string): {
  href: string;
  label: string;
} {
  return changedSince
    ? {
        href: `/privacy?changedSince=${encodeURIComponent(changedSince)}`,
        label: '바뀐 개인정보처리방침 보기',
      }
    : { href: '/privacy', label: '개인정보처리방침' };
}
