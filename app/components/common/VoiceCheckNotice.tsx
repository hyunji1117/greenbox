'use client';
// app/components/common/VoiceCheckNotice.tsx
// 말로 넣은 이름의 상태 안내: 듣는 중 들리는 글자, 고친 이름, 식재료가 아닌 것 같을 때 다시 말하기
// 냉장고 등록과 장보기 담기에서 같이 쓴다

import React from 'react';
import {
  SPEECH_ERROR_TEXT,
  type SpeechError,
} from '@/app/lib/speech/useSpeechInput';
import type { FoodNameCheck } from '@/app/lib/items/foodVocabulary';

interface VoiceCheckNoticeProps {
  isListening: boolean;
  heard: string;
  check: FoodNameCheck | null;
  error: SpeechError | null;
  onRetry: () => void;
  onAcceptHeard: () => void;
  // 듣는 중 안내 문구 (예: "등록할 식재료 이름을 말해 주세요")
  listeningHint: string;
}

const VoiceCheckNotice: React.FC<VoiceCheckNoticeProps> = ({
  isListening,
  heard,
  check,
  error,
  onRetry,
  onAcceptHeard,
  listeningHint,
}) => {
  if (isListening) {
    return (
      <p aria-live="polite" className="mt-2 px-1 text-xs text-[#553C9A]">
        {heard ? `듣고 있어요: ‘${heard}’` : `듣고 있어요. ${listeningHint}`}
      </p>
    );
  }
  if (error) {
    return (
      <p role="alert" className="mt-2 px-1 text-xs text-red-500">
        {SPEECH_ERROR_TEXT[error]}
      </p>
    );
  }
  if (check?.status === 'corrected') {
    return (
      <p aria-live="polite" className="mt-2 px-1 text-xs text-[#553C9A]">
        ‘{check.heard}’를 ‘{check.name}’(으)로 고쳤어요. 맞으면 + 를 눌러 주세요
      </p>
    );
  }
  if (check?.status === 'unknown') {
    return (
      <div
        role="alert"
        className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-gray-700"
      >
        <span className="min-w-0 flex-1">
          ‘{check.heard}’는 식재료 이름이 아닌 것 같아요
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="h-[42px] rounded-xl bg-[#6B46C1] px-3 text-xs font-semibold text-white active:bg-[#553C9A]"
        >
          다시 말하기
        </button>
        <button
          type="button"
          onClick={onAcceptHeard}
          className="h-[42px] rounded-xl px-2 text-xs font-medium text-gray-500 active:bg-gray-100"
        >
          그대로 넣기
        </button>
      </div>
    );
  }
  return null;
};

export default VoiceCheckNotice;
