// app/api/auth/[...nextauth]/route.ts
// Auth.js 로그인, 콜백, 로그아웃 엔드포인트

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
