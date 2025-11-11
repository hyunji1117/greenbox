// app/components/PWAInstallQR.tsx
// PWA 설치 QR 코드 및 안내 컴포넌트

'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

// BeforeInstallPromptEvent 타입 정의
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Window 인터페이스 확장
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface PWAInstallQRProps {
  appUrl?: string;
  appName?: string;
  showInstructions?: boolean;
}

type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown';

interface InstallInstructions {
  title: string;
  steps: string[];
  icon: string;
}

export const PWAInstallQR: React.FC<PWAInstallQRProps> = ({
  appUrl = typeof window !== 'undefined' ? window.location.origin : '',
  appName = 'Our PWA App',
  showInstructions = true,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [userAgent, setUserAgent] = useState<string>('');
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 현재 URL 설정 (서버 사이드 렌더링 대응)
    if (typeof window !== 'undefined') {
      setCurrentUrl(appUrl || window.location.origin);
      setUserAgent(navigator.userAgent);

      // PWA 설치 가능 여부 체크
      const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // 이미 설치되어 있는지 체크
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstallable(false);
      }

      return () => {
        window.removeEventListener(
          'beforeinstallprompt',
          handleBeforeInstallPrompt as EventListener,
        );
      };
    }
  }, [appUrl]);

  const handleInstallClick = async (): Promise<void> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          console.log('PWA 설치 승인');
          setIsInstallable(false);
        } else {
          console.log('PWA 설치 거절');
        }
      } catch (error) {
        console.error('PWA 설치 중 오류:', error);
      } finally {
        setDeferredPrompt(null);
      }
    }
  };

  const getDeviceType = (): DeviceType => {
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios';
    if (/Android/.test(userAgent)) return 'android';
    if (/Windows|Mac|Linux/.test(userAgent)) return 'desktop';
    return 'unknown';
  };

  const getInstallInstructions = (): InstallInstructions => {
    const device = getDeviceType();

    const instructionsMap: Record<DeviceType, InstallInstructions> = {
      ios: {
        title: 'iOS에서 설치하기',
        steps: [
          '1. Safari로 QR 코드 스캔 또는 링크 접속',
          '2. 하단 공유 버튼(□↑) 탭',
          '3. "홈 화면에 추가" 선택',
          '4. 우측 상단 "추가" 탭',
        ],
        icon: '🍎',
      },
      android: {
        title: 'Android에서 설치하기',
        steps: [
          '1. Chrome으로 QR 코드 스캔 또는 링크 접속',
          '2. 우측 상단 메뉴(⋮) 탭',
          '3. "앱 설치" 또는 "홈 화면에 추가" 선택',
          '4. "설치" 탭',
        ],
        icon: '🤖',
      },
      desktop: {
        title: '데스크톱에서 설치하기',
        steps: [
          '1. Chrome/Edge로 링크 접속',
          '2. 주소창 우측 설치 아이콘(⊕) 클릭',
          '3. "설치" 클릭',
        ],
        icon: '💻',
      },
      unknown: {
        title: '앱 설치하기',
        steps: [
          '1. 최신 브라우저로 링크 접속',
          '2. 메뉴에서 "앱 설치" 옵션 찾기',
          '3. 설치 진행',
        ],
        icon: '📱',
      },
    };

    return instructionsMap[device];
  };

  const instructions = getInstallInstructions();

  return (
    <div className="pwa-install-container" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{appName} 설치하기</h2>
        <p style={styles.subtitle}>QR 코드를 스캔하여 앱을 설치하세요</p>
      </div>

      <div style={styles.qrWrapper}>
        <QRCode
          value={currentUrl}
          size={256}
          level="H"
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
        />
      </div>

      <div style={styles.urlContainer}>
        <p style={styles.urlLabel}>또는 직접 접속:</p>
        <a
          href={currentUrl}
          style={styles.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {currentUrl}
        </a>
      </div>

      {/* 현재 기기에서 바로 설치 가능한 경우 */}
      {isInstallable && (
        <button onClick={handleInstallClick} style={styles.installButton}>
          지금 바로 설치하기
        </button>
      )}

      {/* 설치 방법 안내 */}
      {showInstructions && (
        <div style={styles.instructions}>
          <h3 style={styles.instructionTitle}>
            {instructions.icon} {instructions.title}
          </h3>
          <ol style={styles.steps}>
            {instructions.steps.map((step, index) => (
              <li key={index} style={styles.step}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 설치 혜택 안내 */}
      <div style={styles.benefits}>
        <h3 style={styles.benefitTitle}>설치하면 좋은 점</h3>
        <ul style={styles.benefitList}>
          <li>✓ 홈 화면에서 바로 실행</li>
          <li>✓ 오프라인 사용 가능</li>
          <li>✓ 푸시 알림 수신</li>
          <li>✓ 전체 화면 모드</li>
        </ul>
      </div>
    </div>
  );
};

// 스타일 타입 정의
interface Styles {
  container: React.CSSProperties;
  header: React.CSSProperties;
  title: React.CSSProperties;
  subtitle: React.CSSProperties;
  qrWrapper: React.CSSProperties;
  urlContainer: React.CSSProperties;
  urlLabel: React.CSSProperties;
  url: React.CSSProperties;
  installButton: React.CSSProperties;
  instructions: React.CSSProperties;
  instructionTitle: React.CSSProperties;
  steps: React.CSSProperties;
  step: React.CSSProperties;
  benefits: React.CSSProperties;
  benefitTitle: React.CSSProperties;
  benefitList: React.CSSProperties;
}

// 스타일 정의
const styles: Styles = {
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '20px',
    textAlign: 'center',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  qrWrapper: {
    display: 'inline-block',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  urlContainer: {
    marginBottom: '24px',
  },
  urlLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  url: {
    fontSize: '14px',
    color: '#0066cc',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  installButton: {
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '24px',
    transition: 'background-color 0.3s',
  },
  instructions: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  instructionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  steps: {
    margin: '0',
    paddingLeft: '20px',
  },
  step: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '8px',
    lineHeight: 1.5,
  },
  benefits: {
    backgroundColor: '#e8f4ff',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'left',
  },
  benefitTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#0066cc',
  },
  benefitList: {
    listStyle: 'none',
    margin: '0',
    padding: '0',
  },
};

export default PWAInstallQR;
