// app/components/PWADeepLink.tsx
// PWA 딥링크 생성 컴포넌트
// UTM 파라미터 및 단축 URL 옵션 지원

import { useEffect, useState } from 'react';

interface PWADeepLinkWithOptionsProps {
  useShortUrl?: boolean;
  customPath?: string;
  utmSource?: string;
  utmCampaign?: string;
}

export const PWADeepLinkWithOptions: React.FC<PWADeepLinkWithOptionsProps> = ({
  useShortUrl = false,
  customPath = '',
  utmSource = 'qr',
  utmCampaign = 'install',
}) => {
  const [installUrl, setInstallUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const createShortUrl = async (longUrl: string): Promise<string> => {
    try {
      const response = await fetch('/api/shorten-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: longUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.shortUrl || longUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('URL 단축 실패:', errorMessage);
      return longUrl;
    }
  };

  useEffect(() => {
    const generateUrl = async () => {
      setIsLoading(true);

      // PWA URL 생성
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      // UTM 파라미터 추가
      const params = new URLSearchParams({
        utm_source: utmSource,
        utm_campaign: utmCampaign,
      });

      // 딥링크 생성
      const deepLink = `${baseUrl}${customPath}?${params.toString()}`;

      // 조건부로 단축 URL 생성
      let finalUrl = deepLink;
      if (useShortUrl) {
        finalUrl = await createShortUrl(deepLink);
      }

      setInstallUrl(finalUrl);
      setIsLoading(false);
    };

    generateUrl();
  }, [useShortUrl, customPath, utmSource, utmCampaign]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-32 rounded bg-gray-200"></div>
      </div>
    );
  }

  return (
    <div>
      <a
        href={installUrl}
        className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
      >
        <span>앱 설치하기</span>
        <span>→</span>
      </a>
    </div>
  );
};

// 기본 export
export default PWADeepLinkWithOptions;
