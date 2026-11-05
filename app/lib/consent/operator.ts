// app/lib/consent/operator.ts
// 개인정보처리방침과 탈퇴 요청에 쓰는 운영자 연락처
// 개인 운영이라 운영자가 개인정보 보호책임자를 겸한다

import { APP_NAME } from '@/app/lib/brand';

export const OPERATOR = {
  name: '김현지',
  officer: '김현지',
  email: 'eve0204eve@gmail.com',
} as const;

// 동의 화면의 탈퇴 요청: 운영자에게 보낼 메일 창을 연다
// 주소에 이용자 정보는 넣지 않고, 보낸 사람 메일 주소로 계정을 확인한다
export const WITHDRAWAL_MAILTO = `mailto:${OPERATOR.email}?subject=${encodeURIComponent(`${APP_NAME} 회원 탈퇴 요청`)}`;
