'use client';
// app/components/fridge/VoiceSearchBar.tsx
// 음성으로 품목 찾기 바. 바 전체가 버튼이라 어디를 눌러도 말로 찾기가 시작된다
// - 평소: 몽환적인 그라데이션이 테두리를 따라 천천히 흐르고 "음성으로 재료를 찾아요"
// - 듣는 동안: 그라데이션이 빨라지고 빛이 번지며 음파가 움직이고, 들리는 말을 바로 보여 준다
// - 움직임 줄이기 설정을 켠 사람에게는 그라데이션과 음파를 멈춘 채로 보여 준다
// - 긴 문구는 말줄임표 대신 전광판처럼 흘린다 (MarqueeText)

import React from 'react';
import { XIcon } from 'lucide-react';
import MarqueeText from '@/app/components/common/MarqueeText';

// 보라, 분홍, 하늘색을 이어 붙여 끝과 처음이 자연스럽게 이어지게 한다
const AI_GRADIENT =
  'bg-[linear-gradient(90deg,#a78bfa,#f0abfc,#93c5fd,#c4b5fd,#a78bfa)] bg-[length:300%_100%]';

const WAVE_DELAYS = ['0ms', '-150ms', '-300ms', '-450ms', '-600ms'];

interface VoiceSearchBarProps {
  isListening: boolean;
  // 들린 말 또는 찾고 있는 이름
  text: string;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
}

const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  isListening,
  text,
  onStart,
  onStop,
  onClear,
}) => {
  const label = isListening
    ? text || '듣고 있어요. 찾을 재료를 말해 주세요'
    : text
      ? `‘${text}’`
      : '음성으로 재료를 찾아요';

  return (
    <div className="relative">
      {/* 바 뒤로 번지는 빛. 듣는 동안 더 진해진다 */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -inset-1 rounded-full blur-lg ${AI_GRADIENT} ${
          isListening
            ? 'motion-safe:animate-ai-flow-fast opacity-70'
            : 'motion-safe:animate-ai-flow opacity-40'
        }`}
      />
      <button
        type="button"
        aria-label={isListening ? '음성 찾기 멈추기' : '말로 품목 찾기'}
        aria-pressed={isListening}
        onClick={isListening ? onStop : onStart}
        className={`relative block h-12 w-full rounded-full p-[1.5px] ${AI_GRADIENT} ${
          isListening
            ? 'motion-safe:animate-ai-flow-fast'
            : 'motion-safe:animate-ai-flow'
        }`}
      >
        <span className="flex h-full w-full items-center justify-center gap-2.5 rounded-full bg-white/90 px-12 backdrop-blur">
          {/* 음파: 듣는 동안은 크게, 평소에는 잔잔하게 움직인다 */}
          <span
            aria-hidden
            className="flex h-5 shrink-0 items-center gap-[3px]"
          >
            {WAVE_DELAYS.map((delay, index) => (
              <span
                key={delay}
                style={{ animationDelay: delay }}
                className={`w-[3px] rounded-full bg-gradient-to-t from-[#7C5CE0] to-[#E07AD8] ${
                  isListening
                    ? 'motion-safe:animate-ai-wave h-5'
                    : `motion-safe:animate-ai-wave h-3 opacity-70 motion-safe:[animation-duration:2.4s] ${
                        index % 2 ? 'scale-y-50' : ''
                      }`
                }`}
              />
            ))}
          </span>
          {/* 긴 문구는 말줄임표로 자르지 않고 흘려서 끝까지 읽게 한다 (움직임 줄이기면 두 줄) */}
          <span aria-live="polite" className="min-w-0">
            <MarqueeText
              text={label}
              className={`text-[15px] font-semibold ${
                isListening || text
                  ? 'text-[#4B2F8C]'
                  : 'bg-gradient-to-r from-[#6B46C1] via-[#B65BC9] to-[#5B8DEF] bg-clip-text text-transparent'
              }`}
            />
          </span>
        </span>
      </button>
      {text && !isListening && (
        <button
          type="button"
          aria-label="찾기 지우기"
          onClick={onClear}
          className="absolute top-1/2 right-1.5 flex h-[42px] w-[42px] -translate-y-1/2 items-center justify-center rounded-full text-[#6B46C1] active:bg-[#F1EDFA]"
        >
          <XIcon size={18} />
        </button>
      )}
    </div>
  );
};

export default VoiceSearchBar;
