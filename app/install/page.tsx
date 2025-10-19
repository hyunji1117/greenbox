// app/install/page.tsx
// PWA 설치 페이지

import PWAInstallQR from '@/app/components/PWAInstallQR';

export default function InstallPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <PWAInstallQR
        appUrl="https://greenbox-seven.vercel.app/"
        appName="GreenBox - 우리집 냉장고"
        showInstructions={true}
      />
    </div>
  );
}
