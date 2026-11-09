// App.tsx
// 우리집 냉장고 앱: 운영 웹앱을 웹뷰로 열고, 웹뷰에서 어려운 일(구글 로그인, 공유, 뒤로 가기, 외부 링크)은 앱이 맡는다

import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { INJECTED_BEFORE_LOAD, parseWebMessage } from './src/bridge';
import { APP_VERSION, isOwnPage, WEB_URL } from './src/config';
import { loginWithSystemBrowser } from './src/login';

// 웹앱 바탕색과 같게 해 안전 영역과 로딩 화면이 튀지 않게 한다
const BACKGROUND = '#F0F0F4';
const BRAND = '#6B46C1';

// 구글 로그인 화면으로 가려는 순간을 잡아 시스템 브라우저 로그인으로 바꾼다
const isGoogleSignIn = (url: string) => {
  try {
    return new URL(url).hostname === 'accounts.google.com';
  } catch {
    return false;
  }
};

function Shell() {
  // react-native-webview의 기본 제네릭(undefined)은 최신 TypeScript에서 속성을 never로 만들어 object로 정한다
  const webViewRef = useRef<WebView<object>>(null);
  const canGoBackRef = useRef(false);
  const loggingInRef = useRef(false);
  const [uri, setUri] = useState(WEB_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [notice, setNotice] = useState('');

  // 안드로이드 뒤로 가기: 웹뷰 안에서 뒤로 갈 곳이 있으면 웹뷰를 뒤로, 없으면 앱 기본 동작(종료)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBackRef.current) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const startLogin = useCallback(async () => {
    if (loggingInRef.current) return;
    loggingInRef.current = true;
    setNotice('');
    const result = await loginWithSystemBrowser();
    loggingInRef.current = false;
    if (result.status === 'success') {
      // 같은 주소여도 다시 불러오도록 시각을 붙인다
      setUri(`${result.sessionUrl}&t=${Date.now()}`);
    } else if (result.status === 'error') {
      setNotice('로그인하지 못했어요. 다시 시도해 주세요');
    }
  }, []);

  const onShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      const { url } = request;
      if (url.startsWith('about:') || isOwnPage(url)) return true;
      if (isGoogleSignIn(url)) {
        void startLogin();
        return false;
      }
      // 다른 사이트는 웹뷰 밖(브라우저)으로, 전화와 메일 같은 주소는 해당 앱으로 연다
      if (/^https?:\/\//.test(url)) {
        void WebBrowser.openBrowserAsync(url);
      } else {
        void Linking.openURL(url).catch(() => {});
      }
      return false;
    },
    [startLogin],
  );

  const onMessage = useCallback(async (data: string) => {
    const message = parseWebMessage(data);
    if (!message) return;
    if (message.type === 'share') {
      await Share.share({
        title: message.title,
        message: [message.text, message.url].filter(Boolean).join('\n'),
        url: message.url,
      }).catch(() => {});
    }
    if (message.type === 'open-external') {
      await WebBrowser.openBrowserAsync(message.url);
    }
    if (message.type === 'ready') setIsLoading(false);
  }, []);

  const reload = () => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  return (
    // 아래쪽은 웹이 홈 바 높이만큼 직접 비켜 서므로(viewport-fit=cover) 위쪽 상태 표시줄만 비운다
    // 아래까지 비우면 페이지 바탕색과 다른 띠가 홈 바 자리에 남는다
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      {hasError ? (
        <View style={styles.center}>
          <Text style={styles.title}>화면을 불러오지 못했어요</Text>
          <Text style={styles.body}>인터넷 연결을 확인하고 다시 시도해 주세요</Text>
          <Pressable style={styles.button} onPress={reload} accessibilityRole="button">
            <Text style={styles.buttonText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <WebView<object>
          ref={webViewRef}
          source={{ uri }}
          style={styles.webview}
          // 웹이 앱 안에서 열린 것을 알 수 있게 한다 (window.GreenboxApp, 사용자 에이전트)
          injectedJavaScriptBeforeContentLoaded={INJECTED_BEFORE_LOAD}
          applicationNameForUserAgent={`GreenboxApp/${APP_VERSION}`}
          onMessage={event => void onMessage(event.nativeEvent.data)}
          onShouldStartLoadWithRequest={onShouldStartLoad}
          onNavigationStateChange={(state: WebViewNavigation) => {
            canGoBackRef.current = state.canGoBack;
          }}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          // 메모리가 부족해 웹뷰가 내려가면 흰 화면 대신 다시 불러온다
          onContentProcessDidTerminate={() => webViewRef.current?.reload()}
          onRenderProcessGone={() => webViewRef.current?.reload()}
          sharedCookiesEnabled
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          contentInsetAdjustmentBehavior="never"
          originWhitelist={['https://*', 'http://*', 'about:*']}
          // 웹앱이 16px 입력으로 확대를 막고 있어 앱에서 따로 막지 않는다
          bounces={false}
        />
      )}
      {isLoading && !hasError && (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ActivityIndicator color={BRAND} />
        </View>
      )}
      {notice ? (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  webview: { flex: 1, backgroundColor: BACKGROUND },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    backgroundColor: BACKGROUND,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1F1A2E' },
  body: { fontSize: 14, color: '#625D75', textAlign: 'center' },
  button: {
    marginTop: 12,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: BRAND,
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  notice: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    borderRadius: 16,
    backgroundColor: '#2E1F5C',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  noticeText: { color: '#FFFFFF', fontSize: 14, textAlign: 'center' },
});
