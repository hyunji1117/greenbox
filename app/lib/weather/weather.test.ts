// app/lib/weather/weather.test.ts

import { describe, expect, it } from 'vitest';
import { parseWeather, weatherLabel, weatherMood } from './weather';

describe('weatherMood', () => {
  it('비나 눈이 오면 기온과 상관없이 rain, 아니면 기온으로 나눈다', () => {
    expect(weatherMood({ temperature: 30, code: 63 })).toBe('rain');
    expect(weatherMood({ temperature: -2, code: 73 })).toBe('rain');
    expect(weatherMood({ temperature: 8, code: 3 })).toBe('cold');
    expect(weatherMood({ temperature: 26, code: 0 })).toBe('hot');
    expect(weatherMood({ temperature: 15, code: 1 })).toBe('mild');
  });
});

describe('weatherLabel', () => {
  it('날씨 코드를 짧은 한국어로 바꾼다', () => {
    expect(weatherLabel(0)).toBe('맑음');
    expect(weatherLabel(2)).toBe('구름 조금');
    expect(weatherLabel(3)).toBe('흐림');
    expect(weatherLabel(61)).toBe('비');
    expect(weatherLabel(75)).toBe('눈');
  });
});

describe('parseWeather', () => {
  it('기온과 코드가 숫자일 때만 받고, 모양이 다르면 null', () => {
    expect(
      parseWeather({ current: { temperature_2m: 7.4, weather_code: 3 } }),
    ).toEqual({ temperature: 7.4, code: 3 });
    expect(parseWeather({ current: { temperature_2m: '7' } })).toBeNull();
    expect(parseWeather(null)).toBeNull();
  });
});
