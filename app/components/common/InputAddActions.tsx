'use client';
// app/components/common/InputAddActions.tsx
// 입력창 오른쪽의 카메라, 음성, 넣기 버튼. 냉장고 등록과 장보기 식재료 담기에서 같은 모양과 동작으로 쓴다
// - 비어 있으면 카메라와 음성을 처음부터 보여 준다 (+ 안에 숨겨 두었더니 가족들이 기능이 있는 줄 몰랐다)
// - 글자를 적으면 두 버튼 자리에 + (바로 넣기)가 나온다
// - 말하는 동안에는 음성 버튼을 남겨 멈추기를 누를 수 있게 한다
// - 버튼 터치 영역은 42x42로 맞추고, 버튼 사이는 4px 띄운다

import React from 'react';
import { CameraIcon, Loader2Icon, MicIcon, PlusIcon } from 'lucide-react';

interface SpeechControls {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
}

interface InputAddActionsProps {
  // 적은 글자가 있어 바로 넣을 수 있는지
  canSubmit: boolean;
  isSubmitting?: boolean;
  // 넣기 버튼의 읽기 이름 (예: "식재료 추가")
  submitLabel: string;
  onCamera: () => void;
  speech: SpeechControls;
  // 눌러도 입력창의 포커스를 유지해서 모바일 키보드가 닫히지 않게 한다
  keepFocus?: (event: React.MouseEvent) => void;
}

const TRAY_BUTTON =
  'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#6B46C1] transition-colors active:bg-[#E6DFF7]';

const InputAddActions: React.FC<InputAddActionsProps> = ({
  canSubmit,
  isSubmitting = false,
  submitLabel,
  onCamera,
  speech,
  keepFocus,
}) => {
  const showsTools = speech.isListening || !canSubmit;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {showsTools && (
        <>
          <button
            type="button"
            aria-label="사진으로 찾기"
            onClick={onCamera}
            className={TRAY_BUTTON}
          >
            <CameraIcon size={20} />
          </button>
          {speech.isSupported && (
            <button
              type="button"
              aria-label={speech.isListening ? '음성 입력 멈추기' : '말로 넣기'}
              aria-pressed={speech.isListening}
              onClick={speech.isListening ? speech.stop : speech.start}
              className={`relative ${TRAY_BUTTON} ${
                speech.isListening ? 'ring-2 ring-[#A794D6]' : ''
              }`}
            >
              {/* 듣는 동안 빨간 녹음 불이 깜빡인다 */}
              {speech.isListening && (
                <span
                  aria-hidden
                  className="motion-safe:animate-rec-blink absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                />
              )}
              <MicIcon size={18} />
            </button>
          )}
        </>
      )}
      {canSubmit && (
        <button
          type="submit"
          aria-label={isSubmitting ? '넣는 중' : submitLabel}
          onMouseDown={keepFocus}
          disabled={isSubmitting}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#6B46C1] text-white transition-colors active:bg-[#553C9A] disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2Icon size={20} className="motion-safe:animate-spin" />
          ) : (
            <PlusIcon size={20} />
          )}
        </button>
      )}
    </div>
  );
};

export default InputAddActions;
