// src/login.ts
// 구글 로그인은 앱 속 웹뷰에서 막혀서 시스템 브라우저로 한다
// 무작위 비밀값(verifier)을 만들고 지문(challenge)만 웹에 넘긴다. 돌아온 코드는 비밀값과 함께 써야만 로그인된다
// 웹 쪽 구현: app/lib/mobile/handoff.ts

import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { WEB_URL } from './config';

const toBase64Url = (base64: string) =>
  base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function randomVerifier(): string {
  const bytes = Crypto.getRandomBytes(32);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return toBase64Url(btoa(binary));
}

export type LoginResult =
  | { status: 'success'; sessionUrl: string }
  | { status: 'cancel' }
  | { status: 'error'; reason: string };

function resultFrom(url: string, verifier: string): LoginResult {
  const params = new URL(url).searchParams;
  const code = params.get('code');
  if (!code) return { status: 'error', reason: params.get('error') ?? 'unknown' };
  const session = new URL('/api/mobile/session', WEB_URL);
  session.searchParams.set('code', code);
  session.searchParams.set('verifier', verifier);
  return { status: 'success', sessionUrl: session.toString() };
}

export async function loginWithSystemBrowser(): Promise<LoginResult> {
  const verifier = randomVerifier();
  const challenge = toBase64Url(
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
      encoding: Crypto.CryptoEncoding.BASE64,
    }),
  );
  // 설치한 앱은 greenbox://auth, 개발 중 Expo Go는 exp://…/--/auth 로 돌아온다
  const redirect = Linking.createURL('auth');
  const start = new URL('/mobile/login', WEB_URL);
  start.searchParams.set('challenge', challenge);
  start.searchParams.set('redirect', redirect);

  // 안드로이드는 앱으로 돌아오는 주소를 직접 받아 브라우저를 닫아야 한다 (Expo 문서)
  let androidUrl: string | null = null;
  const subscription =
    Platform.OS === 'android'
      ? Linking.addEventListener('url', ({ url }) => {
          if (url.startsWith(redirect)) {
            androidUrl = url;
            void WebBrowser.dismissBrowser();
          }
        })
      : null;

  try {
    const result = await WebBrowser.openAuthSessionAsync(
      start.toString(),
      redirect,
    );
    if (result.type === 'success') return resultFrom(result.url, verifier);
    if (androidUrl) return resultFrom(androidUrl, verifier);
    return { status: 'cancel' };
  } catch (error) {
    return { status: 'error', reason: (error as Error).message };
  } finally {
    subscription?.remove();
  }
}
