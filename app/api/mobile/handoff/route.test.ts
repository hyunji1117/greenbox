// @vitest-environment node
// app/api/mobile/handoff/route.test.ts

import { encode } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { GET } from './route';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-for-mobile-handoff-0123456789';
});

const CHALLENGE = 'a'.repeat(43);

async function request(cookies: Record<string, string>) {
  const req = new NextRequest('https://greenbox.test/api/mobile/handoff', {
    headers: {
      cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
    },
  });
  return GET(req);
}

describe('GET /api/mobile/handoff', () => {
  it('로그인한 브라우저면 2분짜리 코드를 담아 앱으로 돌려주고 지문 쿠키를 지운다', async () => {
    const name = '__Secure-authjs.session-token';
    const session = await encode({
      token: { uid: '7' },
      secret: process.env.AUTH_SECRET!,
      salt: name,
    });
    const res = await request({
      [name]: session,
      greenbox_mobile_challenge: CHALLENGE,
    });
    const location = new URL(res.headers.get('location')!);
    expect(location.protocol).toBe('greenbox:');
    expect(location.searchParams.get('code')).toBeTruthy();
    expect(res.headers.get('set-cookie')).toContain(
      'greenbox_mobile_challenge=;',
    );
  });

  it('지문이 없거나 로그인하지 않았으면 오류를 담아 앱으로 돌려준다', async () => {
    const noChallenge = await request({});
    expect(
      new URL(noChallenge.headers.get('location')!).searchParams.get('error'),
    ).toBe('expired');
    const noSession = await request({ greenbox_mobile_challenge: CHALLENGE });
    expect(
      new URL(noSession.headers.get('location')!).searchParams.get('error'),
    ).toBe('no_session');
  });

  it('Expo Go 주소는 허용하고 다른 주소로는 돌려보내지 않는다', async () => {
    const name = '__Secure-authjs.session-token';
    const session = await encode({
      token: { uid: '7' },
      secret: process.env.AUTH_SECRET!,
      salt: name,
    });
    const expo = await request({
      [name]: session,
      greenbox_mobile_challenge: CHALLENGE,
      greenbox_mobile_redirect: 'exp://192.168.0.5:8081/--/auth',
    });
    expect(expo.headers.get('location')).toMatch(
      /^exp:\/\/192\.168\.0\.5:8081\/--\/auth\?code=/,
    );
    const evil = await request({
      [name]: session,
      greenbox_mobile_challenge: CHALLENGE,
      greenbox_mobile_redirect: 'https://evil.test/steal',
    });
    expect(evil.headers.get('location')).toMatch(/^greenbox:\/\/auth\?code=/);
  });
});
