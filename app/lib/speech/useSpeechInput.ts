// app/lib/speech/useSpeechInput.ts
// 말로 입력하기 (브라우저 음성 인식, 한국어). 지원하지 않는 브라우저에서는 isSupported가 false
// 크롬 계열은 녹음한 소리를 브라우저 회사 서버로 보내 글자로 바꾼다. 앱 서버에는 글자만 남는다

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// TypeScript 기본 타입에 아직 없는 부분만 선언한다
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export type SpeechError = 'denied' | 'no-speech' | 'failed';

export const SPEECH_ERROR_TEXT: Record<SpeechError, string> = {
  denied: '마이크 사용이 막혀 있어요. 브라우저 설정에서 마이크를 허용해 주세요',
  'no-speech': '말소리를 듣지 못했어요. 다시 눌러 말해 주세요',
  failed: '음성으로 찾지 못했어요. 글자로 찾아 주세요',
};

// 인식된 문장 끝의 마침표, 물음표 등을 떼어 검색어로 쓴다
export function toSearchText(transcript: string): string {
  return transcript
    .trim()
    .replace(/[.,!?。]+$/u, '')
    .trim();
}

export function useSpeechInput(onText: (text: string) => void) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<SpeechError | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  // 서버가 그린 화면과 맞추기 위해 지원 여부는 화면이 붙은 뒤에 확인한다
  useEffect(() => {
    setIsSupported(Boolean(getRecognition()));
    return () => recognitionRef.current?.abort();
  }, []);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = getRecognition();
    if (!Ctor || recognitionRef.current) return;
    const recognition = new Ctor();
    recognition.lang = 'ko-KR';
    // 말하는 동안에도 글자가 바로 보이게 한다
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      onTextRef.current(toSearchText(transcript));
    };
    recognition.onerror = event => {
      setError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'denied'
          : event.error === 'no-speech'
            ? 'no-speech'
            : event.error === 'aborted'
              ? null
              : 'failed',
      );
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError('failed');
    }
  }, []);

  return { isSupported, isListening, error, start, stop };
}
