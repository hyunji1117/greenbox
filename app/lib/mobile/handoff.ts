// app/lib/mobile/handoff.ts
// 모바일 앱 로그인 넘겨주기 (서버 전용)
// 구글은 앱 속 웹뷰에서 로그인을 막으므로, 앱은 시스템 브라우저로 로그인하고 그 로그인을 웹뷰로 넘겨받는다
// 1) 앱이 무작위 비밀값(verifier)을 만들고 그 지문(challenge)만 /mobile/login에 넘긴다
// 2) 시스템 브라우저에서 구글 로그인 → /api/mobile/handoff가 로그인 정보와 지문을 담은 2분짜리 코드를 만들어 greenbox://auth로 돌려준다
// 3) 앱이 웹뷰에서 /api/mobile/session?code=&verifier= 를 열면, 지문이 맞을 때만 웹뷰에 로그인 쿠키를 심는다
// 코드를 다른 앱이 가로채도 비밀값이 없으면 쓸 수 없다 (PKCE와 같은 방식)

import { createHash } from 'node:crypto';
import { decode, encode } from 'next-auth/jwt';

export const CHALLENGE_COOKIE = 'greenbox_mobile_challenge';
export const REDIRECT_COOKIE = 'greenbox_mobile_redirect';
export const APP_REDIRECT = 'greenbox://auth';

// 로그인 뒤 돌아갈 앱 주소는 우리 앱(greenbox://auth)이나 개발 중 Expo Go(exp://…/--/auth)만 허용한다
const ALLOWED_REDIRECT =
  /^(greenbox:\/\/auth|exp:\/\/[A-Za-z0-9.:_-]+\/--\/auth)$/;
export const isAllowedRedirect = (url: string) => ALLOWED_REDIRECT.test(url);
const HANDOFF_SALT = 'greenbox-mobile-handoff';
const HANDOFF_MAX_AGE = 120;
// Auth.js 기본 세션 길이와 같게 (30일)
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

// base64url로 만든 SHA-256 지문은 43글자다
export const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const VERIFIER_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

export function challengeOf(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

// https에서는 Auth.js가 __Secure- 이름을 쓴다
export function sessionCookieName(secure: boolean): string {
  return secure ? '__Secure-authjs.session-token' : 'authjs.session-token';
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET 환경변수가 없습니다');
  return value;
}

type SessionToken = Record<string, unknown>;

// 브라우저의 세션 쿠키(나뉘어 있으면 이어 붙여)를 풀어 로그인 정보를 얻는다
export async function readSessionToken(
  cookies: { name: string; value: string }[],
  cookieName: string,
): Promise<SessionToken | null> {
  const whole = cookies.find(c => c.name === cookieName)?.value;
  const chunks = cookies
    .filter(c => c.name.startsWith(`${cookieName}.`))
    .sort(
      (a, b) =>
        Number(a.name.slice(cookieName.length + 1)) -
        Number(b.name.slice(cookieName.length + 1)),
    )
    .map(c => c.value)
    .join('');
  const raw = whole ?? (chunks || undefined);
  if (!raw) return null;
  return (await decode({
    token: raw,
    secret: secret(),
    salt: cookieName,
  })) as SessionToken | null;
}

export async function createHandoffCode(
  session: SessionToken,
  challenge: string,
): Promise<string> {
  return encode({
    token: { session, challenge },
    secret: secret(),
    salt: HANDOFF_SALT,
    maxAge: HANDOFF_MAX_AGE,
  });
}

// 코드가 유효하고 비밀값의 지문이 맞으면 로그인 정보를 돌려준다
export async function redeemHandoffCode(
  code: string,
  verifier: string,
): Promise<SessionToken | null> {
  if (!VERIFIER_PATTERN.test(verifier)) return null;
  type Payload = { session?: SessionToken; challenge?: string };
  let payload: Payload | null;
  try {
    payload = (await decode({
      token: code,
      secret: secret(),
      salt: HANDOFF_SALT,
    })) as Payload | null;
  } catch {
    return null;
  }
  if (!payload?.session || !payload.challenge) return null;
  if (payload.challenge !== challengeOf(verifier)) return null;
  return payload.session;
}

export async function createSessionCookieValue(
  session: SessionToken,
  cookieName: string,
): Promise<string> {
  // 넘겨받은 로그인 정보에서 만료 시각 같은 표준 필드는 새로 정한다
  const rest = { ...session };
  delete rest.exp;
  delete rest.iat;
  delete rest.jti;
  return encode({
    token: rest,
    secret: secret(),
    salt: cookieName,
    maxAge: SESSION_MAX_AGE,
  });
}
