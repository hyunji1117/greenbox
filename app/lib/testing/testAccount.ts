// app/lib/testing/testAccount.ts
// 테스트 설정(앱 버전 5번 눌러 여는 개발자 영역: 테스트 기기 표시, 테스트 알림, 가이드 테스트)을 쓸 수 있는 유일한 계정
// 화면은 이 계정에서만 영역을 열고, 서버(테스트 알림)도 같은 이메일로 다시 확인한다

export const TEST_ACCOUNT_EMAIL = 'greenboxtest7@gmail.com';

export function isTestAccount(email: string | null | undefined): boolean {
  return email === TEST_ACCOUNT_EMAIL;
}
