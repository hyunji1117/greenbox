// src/config.ts
// 앱이 여는 웹 주소와 앱 정보. 웹 주소는 app.json의 extra.webUrl (운영 주소가 기본)

import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const WEB_URL: string =
  (Constants.expoConfig?.extra?.webUrl as string | undefined) ??
  'https://greenbox-seven.vercel.app';

export const WEB_ORIGIN = new URL(WEB_URL).origin;

export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
export const PLATFORM = Platform.OS === 'ios' ? 'ios' : 'android';

export const isOwnPage = (url: string) => {
  try {
    return new URL(url).origin === WEB_ORIGIN;
  } catch {
    return false;
  }
};
