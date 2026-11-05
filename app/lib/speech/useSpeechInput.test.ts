// app/lib/speech/useSpeechInput.test.ts

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toSearchText, useSpeechInput } from './useSpeechInput';

// 브라우저 음성 인식을 흉내 낸다. 마지막으로 만든 인식기를 테스트에서 조종한다
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = false;
  continuous = true;
  maxAlternatives = 0;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();
  constructor() {
    FakeRecognition.last = this;
  }
  say(text: string) {
    this.onresult?.({
      results: [Object.assign([{ transcript: text }], { isFinal: true })],
    });
  }
}

afterEach(() => {
  delete (window as { webkitSpeechRecognition?: unknown })
    .webkitSpeechRecognition;
  FakeRecognition.last = null;
});

describe('toSearchText', () => {
  it('문장 끝 부호와 앞뒤 공백을 뗀다', () => {
    expect(toSearchText(' 양파. ')).toBe('양파');
    expect(toSearchText('우유?')).toBe('우유');
  });
});

describe('useSpeechInput', () => {
  it('지원하지 않는 브라우저에서는 쓸 수 없다고 알린다', () => {
    const { result } = renderHook(() => useSpeechInput(vi.fn()));
    expect(result.current.isSupported).toBe(false);
  });

  it('한국어로 듣고 말한 내용을 검색어로 넘긴 뒤 끝나면 듣기를 멈춘다', () => {
    (window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition =
      FakeRecognition;
    const onText = vi.fn();
    const { result } = renderHook(() => useSpeechInput(onText));
    expect(result.current.isSupported).toBe(true);

    act(() => result.current.start());
    const recognition = FakeRecognition.last!;
    expect(recognition.lang).toBe('ko-KR');
    expect(result.current.isListening).toBe(true);

    act(() => recognition.say('대파.'));
    expect(onText).toHaveBeenLastCalledWith('대파');

    act(() => result.current.stop());
    expect(result.current.isListening).toBe(false);
  });

  it('마이크를 막으면 허용해 달라는 오류를 준다', () => {
    (window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition =
      FakeRecognition;
    const { result } = renderHook(() => useSpeechInput(vi.fn()));

    act(() => result.current.start());
    act(() => {
      FakeRecognition.last!.onerror?.({ error: 'not-allowed' });
      FakeRecognition.last!.onend?.();
    });

    expect(result.current.error).toBe('denied');
    expect(result.current.isListening).toBe(false);
  });
});
