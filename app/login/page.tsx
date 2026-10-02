// app/login/page.tsx
// 로그인 화면. 로그인은 필수이고, 필수 항목에 동의해야 구글 로그인 버튼이 켜진다.
// 구글 OAuth 앱 게시 조건상 로그인 없이 앱 소개와 방침 링크를 볼 수 있어야 한다.

import type { Metadata } from 'next';
import AuthShell from '@/app/components/auth/AuthShell';
import LoginForm from './LoginForm';
import { APP_NAME } from '@/app/lib/brand';

export const metadata: Metadata = {
  title: '로그인',
};

export default function LoginPage() {
  return (
    <AuthShell
      title={`${APP_NAME} 시작하기`}
      description={
        <>
          냉장고 속 식재료와 유통기한, 장보기 목록을
          <br />
          한곳에서 관리해요. 구글 계정으로 로그인해 주세요.
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
