// app/_client/NativeAppReady.tsx
// 모바일 앱 안에서 열렸으면 첫 화면이 그려진 뒤 앱에 알린다 (앱의 로딩 표시를 닫는다)

'use client';

import { useEffect } from 'react';
import { notifyAppReady } from '@/app/lib/app/nativeBridge';

export default function NativeAppReady() {
  useEffect(() => {
    notifyAppReady();
  }, []);
  return null;
}
