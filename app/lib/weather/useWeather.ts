'use client';
// app/lib/weather/useWeather.ts
// 지금 날씨. 30분 동안은 다시 묻지 않고, 실패해도 다시 시도하지 않는다 (계절만으로 고르면 되므로)

import { useQuery } from '@tanstack/react-query';
import { parseWeather, WEATHER_URL } from '@/app/lib/weather/weather';

export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'seoul'],
    queryFn: async () => {
      const res = await fetch(WEATHER_URL, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      return parseWeather(await res.json());
    },
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
