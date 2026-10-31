// app/install/page.tsx
// PWA 설치 페이지

import PWAInstallQR from '@/app/components/notification/PWAInstallQR';
import { APP_NAME } from '@/app/lib/brand';

export default function InstallPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <PWAInstallQR
        appUrl="https://greenbox-seven.vercel.app/"
        appName={APP_NAME}
        showInstructions={true}
      />
    </div>
  );
}
