// app/lib/weather/weather.ts
// "오늘 뭐 먹지"에 쓰는 지금 날씨. Open-Meteo(키 없음)에서 서울의 기온과 날씨 코드만 받는다
// 위치 권한을 묻지 않고, 사용자 정보는 보내지 않는다. 못 받으면 계절만으로 고른다

import type { WeatherMood } from '@/app/lib/recipes/homeRecipes';

// 서울 시청 좌표
export const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=37.57&longitude=126.98&current=temperature_2m,weather_code&timezone=Asia%2FSeoul';

export interface CurrentWeather {
  temperature: number;
  code: number;
}

// WMO 날씨 코드 (https://open-meteo.com/en/docs): 51~67 이슬비와 비, 71~77 눈, 80~86 소나기와 소낙눈, 95~99 뇌우
const isWet = (code: number) =>
  (code >= 51 && code <= 67) ||
  (code >= 71 && code <= 77) ||
  (code >= 80 && code <= 86) ||
  code >= 95;

export function weatherMood({
  temperature,
  code,
}: CurrentWeather): WeatherMood {
  if (isWet(code)) return 'rain';
  if (temperature <= 8) return 'cold';
  if (temperature >= 26) return 'hot';
  return 'mild';
}

export function weatherLabel(code: number): string {
  if (code >= 71 && code <= 77) return '눈';
  if (code >= 85 && code <= 86) return '눈';
  if (isWet(code)) return '비';
  if (code >= 45 && code <= 48) return '안개';
  if (code === 0) return '맑음';
  if (code <= 2) return '구름 조금';
  return '흐림';
}

export const MOOD_LINE: Record<WeatherMood, string> = {
  cold: '쌀쌀한 날엔 따뜻한 국물 어때요?',
  hot: '더운 날엔 시원하고 가벼운 요리로',
  rain: '비 오는 날엔 부침개와 찌개',
  mild: '냉장고 재료로 바로 만들어요',
};

export function parseWeather(json: unknown): CurrentWeather | null {
  const current = (json as { current?: Record<string, unknown> } | null)
    ?.current;
  const temperature = current?.temperature_2m;
  const code = current?.weather_code;
  if (typeof temperature !== 'number' || typeof code !== 'number') return null;
  return { temperature, code };
}
