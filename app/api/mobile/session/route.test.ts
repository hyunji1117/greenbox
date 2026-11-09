// @vitest-environment node
// app/api/mobile/session/route.test.ts

import { randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { challengeOf, createHandoffCode } from '@/app/lib/mobile/handoff';
import { GET } from './route';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-for-mobile-handoff-0123456789';
});

const open = (code: string, verifier: string) =>
  GET(
    new NextRequest(
      `https://greenbox.test/api/mobile/session?code=${encodeURIComponent(code)}&verifier=${verifier}`,
    ),
  );

describe('GET /api/mobile/session', () => {
  it('맞는 코드와 비밀값이면 웹뷰에 로그인 쿠키를 심고 첫 화면으로 보낸다', async () => {
    const verifier = randomBytes(32).toString('base64url');
    const code = await createHandoffCode({ uid: '7' }, challengeOf(verifier));

    const res = await open(code, verifier);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://greenbox.test/');
    const cookie = res.cookies.get('__Secure-authjs.session-token');
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);
  });

  it('비밀값이 다르면 로그인하지 않고 로그인 화면으로 보낸다', async () => {
    const code = await createHandoffCode(
      { uid: '7' },
      challengeOf(randomBytes(32).toString('base64url')),
    );
    const res = await open(code, randomBytes(32).toString('base64url'));
    expect(res.headers.get('location')).toBe(
      'https://greenbox.test/login?mobile=failed',
    );
    expect(res.cookies.get('__Secure-authjs.session-token')).toBeUndefined();
  });
});
