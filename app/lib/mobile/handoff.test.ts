// @vitest-environment node
// app/lib/mobile/handoff.test.ts

import { randomBytes } from 'node:crypto';
import { encode } from 'next-auth/jwt';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  CHALLENGE_PATTERN,
  challengeOf,
  createHandoffCode,
  createSessionCookieValue,
  readSessionToken,
  redeemHandoffCode,
  sessionCookieName,
} from './handoff';

const verifier = () => randomBytes(32).toString('base64url');
const session = { uid: '7', consentVersion: '2026-11-05', name: '현지' };

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-for-mobile-handoff-0123456789';
});

describe('모바일 로그인 넘겨주기', () => {
  it('비밀값의 지문은 43글자 base64url이다', () => {
    expect(challengeOf(verifier())).toMatch(CHALLENGE_PATTERN);
  });

  it('코드와 처음 만든 비밀값이 맞을 때만 로그인 정보를 돌려준다', async () => {
    const v = verifier();
    const code = await createHandoffCode(session, challengeOf(v));

    expect(await redeemHandoffCode(code, v)).toMatchObject(session);
    // 코드를 가로채도 비밀값이 다르면 쓸 수 없다
    expect(await redeemHandoffCode(code, verifier())).toBeNull();
    expect(await redeemHandoffCode('망가진 코드', v)).toBeNull();
  });

  it('브라우저 세션 쿠키(나뉜 경우 포함)를 풀고, 웹뷰용 세션 쿠키로 다시 만든다', async () => {
    const name = sessionCookieName(true);
    const raw = await encode({
      token: session,
      secret: process.env.AUTH_SECRET!,
      salt: name,
    });
    expect(await readSessionToken([{ name, value: raw }], name)).toMatchObject(
      session,
    );
    const half = Math.floor(raw.length / 2);
    expect(
      await readSessionToken(
        [
          { name: `${name}.1`, value: raw.slice(half) },
          { name: `${name}.0`, value: raw.slice(0, half) },
        ],
        name,
      ),
    ).toMatchObject(session);
    expect(await readSessionToken([], name)).toBeNull();

    const value = await createSessionCookieValue(session, name);
    expect(await readSessionToken([{ name, value }], name)).toMatchObject(
      session,
    );
  });
});
