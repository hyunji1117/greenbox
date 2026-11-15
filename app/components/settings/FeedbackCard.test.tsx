// app/components/settings/FeedbackCard.test.tsx

import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track, apiFetch, speech } = vi.hoisted(() => ({
  track: vi.fn(),
  apiFetch: vi.fn(),
  speech: { onText: (() => {}) as (text: string) => void },
}));

vi.mock('@/app/lib/analytics/gtag', () => ({ track }));
vi.mock('@/app/lib/api/apiFetch', () => ({ apiFetch }));
// 브라우저 음성 인식 대신, 테스트가 말을 넣고 듣기를 끝낸다
vi.mock('@/app/lib/speech/useSpeechInput', async () => {
  const { useState } = await import('react');
  return {
    useSpeechInput: (onText: (text: string) => void) => {
      const [isListening, setIsListening] = useState(false);
      speech.onText = onText;
      return {
        isSupported: true,
        isListening,
        error: null,
        start: () => setIsListening(true),
        stop: () => setIsListening(false),
      };
    },
  };
});

import FeedbackCard from './FeedbackCard';

const renderCard = () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FeedbackCard />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /의견 보내기/ }));
};

// 말을 마치면 인식이 스스로 멈춘다 (continuous: false)
const speakAndEnd = (text: string) => {
  fireEvent.click(screen.getByRole('button', { name: /동의하고 말로 보내기/ }));
  act(() => speech.onText(text));
  fireEvent.click(screen.getByRole('button', { name: /멈춤/ }));
};

beforeEach(() => {
  vi.useFakeTimers();
  apiFetch.mockResolvedValue(null);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('FeedbackCard 말로 보내기', () => {
  it('말을 마치면 3초 뒤 저절로 보내고, 고마움 화면은 4초 뒤 닫힌다', async () => {
    renderCard();
    speakAndEnd('알림이 너무 일찍 와요');
    expect(screen.getByText('3초 뒤 보내요')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(apiFetch).toHaveBeenCalledWith(
      '/api/feedback',
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          text: '알림이 너무 일찍 와요',
          inputMethod: 'voice',
          agreed: true,
        }),
      }),
    );
    expect(track).toHaveBeenCalledWith('feedback_sent', {
      input: 'voice',
      auto: true,
    });
    expect(screen.getByRole('button', { name: '확인 (4)' })).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(screen.queryByText(/꼼꼼히 읽고 반영할게요/)).toBeNull();
  });

  it('고치기를 누르면 저절로 보내지 않고 글을 고친 뒤 직접 보낸다', async () => {
    renderCard();
    speakAndEnd('알림이 너무 일직 와요');
    fireEvent.click(screen.getByRole('button', { name: '고치기' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(apiFetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('의견 내용'), {
      target: { value: '알림이 너무 일찍 와요' },
    });
    fireEvent.click(screen.getByRole('button', { name: '동의하고 보내기' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(track).toHaveBeenCalledWith('feedback_sent', {
      input: 'voice',
      auto: false,
    });
  });
});
