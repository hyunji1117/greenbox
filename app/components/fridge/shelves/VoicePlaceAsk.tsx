'use client';
// app/components/fridge/shelves/VoicePlaceAsk.tsx
// 음성으로 넣을 때 "오이! 어디에 넣을까요?" 시트 위쪽에 두는 말하기 영역 (2026-11-20)
// - 들은 이름이 마이크 위에 한 글자씩 써진다 (첫소리 → 완성 글자)
// - 앱이 소리로 묻고(추천 자리 포함), 다 말한 뒤에 마이크를 켠다 (앱 목소리를 사용자 답으로 듣지 않게)
// - 답은 "추천대로", "맨 아래", "3번"처럼 말한다. 예시는 누를 수 없는 글로만 보여 준다 (누르는 건 아래 지도)
// - 못 알아들으면 다시 말하기를 권하고, 지도를 눌러도 된다
// 안드로이드 앱 웹뷰에서는 브라우저 음성 인식이 없어 마이크 대신 지도만 쓴다 (isSupported가 false)

import React, { useEffect, useRef, useState } from 'react';
import { MicIcon } from 'lucide-react';
import type { Category } from '@/app/lib/schemas/item';
import { parsePlaceAnswer, typingFrames } from '@/app/lib/speech/placeAnswer';
import {
  useSpeechInput,
  SPEECH_ERROR_TEXT,
} from '@/app/lib/speech/useSpeechInput';
import { CATEGORY_LABEL } from '@/app/components/fridge/shelves/ShelfMapPicker';

const TYPING_MS = 220;

interface VoicePlaceAskProps {
  name: string;
  category: Category;
  shelfCount: number;
  recommended: number;
  // 소리로 읽을 추천 자리 ("냉장실 맨 아래 5번 선반")
  recommendedPlace: string;
  onPick: (shelf: number) => void;
}

function speak(text: string, onDone: () => void): () => void {
  const synth =
    typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    const timer = window.setTimeout(onDone, 300);
    return () => window.clearTimeout(timer);
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  const korean = synth.getVoices().find(voice => /^ko/i.test(voice.lang));
  if (korean) utterance.voice = korean;
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    onDone();
  };
  utterance.onend = done;
  utterance.onerror = done;
  synth.cancel();
  synth.speak(utterance);
  // 일부 브라우저는 끝 신호를 보내지 않아, 넉넉한 시간 뒤에는 마이크를 켠다
  const fallback = window.setTimeout(done, 6000);
  return () => {
    window.clearTimeout(fallback);
    finished = true;
    synth.cancel();
  };
}

const VoicePlaceAsk: React.FC<VoicePlaceAskProps> = ({
  name,
  category,
  shelfCount,
  recommended,
  recommendedPlace,
  onPick,
}) => {
  const [typed, setTyped] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const answerRef = useRef('');
  const speech = useSpeechInput(text => {
    answerRef.current = text;
    setAnswer(text);
  });
  const { start: startListening, isSupported } = speech;

  // 들은 이름이 써지는 모습 (움직임 줄이기면 바로 보여 준다)
  useEffect(() => {
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) {
      setTyped(name);
      return;
    }
    const frames = typingFrames(name);
    let index = 0;
    setTyped('');
    const timer = window.setInterval(() => {
      setTyped(frames[index] ?? name);
      index += 1;
      if (index >= frames.length) window.clearInterval(timer);
    }, TYPING_MS);
    return () => window.clearInterval(timer);
  }, [name]);

  // 소리로 묻고, 다 말하면 듣기 시작한다
  const latest = useRef({ isSupported, startListening });
  useEffect(() => {
    latest.current = { isSupported, startListening };
  }, [isSupported, startListening]);
  useEffect(
    () =>
      speak(
        `${name}! 어디에 넣을까요? 추천은 ${recommendedPlace}이에요.`,
        () => {
          if (latest.current.isSupported) latest.current.startListening();
        },
      ),
    [name, recommendedPlace],
  );

  // 듣기가 끝나면 한 번 알아듣는다
  const wasListening = useRef(false);
  useEffect(() => {
    if (speech.isListening) {
      wasListening.current = true;
      return;
    }
    if (!wasListening.current) return;
    wasListening.current = false;
    const spoken = answerRef.current;
    answerRef.current = '';
    if (!spoken) return;
    const result = parsePlaceAnswer(spoken, category, shelfCount, recommended);
    if (result.kind === 'shelf') {
      setHint('');
      onPick(result.shelf);
    } else if (result.kind === 'other-category') {
      setHint(
        `지금은 ${CATEGORY_LABEL[category]} 선반만 고를 수 있어요. 번호나 "추천대로"라고 말해 주세요`,
      );
    } else {
      setHint('잘 못 들었어요. 다시 말하거나 아래 선반을 눌러 주세요');
    }
    // 듣기가 끝난 순간에만 판단한다
  }, [speech.isListening, category, shelfCount, recommended, onPick]);

  const listenAgain = () => {
    setHint('');
    setAnswer('');
    speech.start();
  };

  return (
    <div className="text-center">
      <p className="text-[11px] text-gray-500">들은 말</p>
      <p
        aria-label={name}
        className="mt-0.5 flex min-h-10 items-center justify-center text-3xl font-extrabold tracking-tight text-gray-900"
      >
        <span aria-hidden>{typed}</span>
        <span
          aria-hidden
          className="ml-0.5 inline-block h-7 w-0.5 bg-[#6B46C1] motion-safe:animate-pulse"
        />
      </p>
      {isSupported && (
        <button
          type="button"
          onClick={listenAgain}
          aria-label={speech.isListening ? '듣는 중' : '다시 말하기'}
          className={`mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#6B46C1] text-white transition-shadow ${
            speech.isListening
              ? 'shadow-[0_0_0_10px_#F1EDFA] motion-safe:animate-pulse'
              : 'shadow-[0_0_0_6px_#F1EDFA]'
          }`}
        >
          <MicIcon size={24} />
        </button>
      )}
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-[#553C9A]">
        {speech.isListening
          ? answer || '듣고 있어요'
          : hint || (speech.error ? SPEECH_ERROR_TEXT[speech.error] : answer)}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        <span className="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
          예시
        </span>
        “추천대로” · “맨 아래” · “3번”
      </p>
    </div>
  );
};

export default VoicePlaceAsk;
