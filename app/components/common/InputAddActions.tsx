'use client';
// app/components/common/InputAddActions.tsx
// 입력창 오른쪽의 + 버튼. 냉장고 등록과 장보기 식재료 담기에서 같은 모양과 동작으로 쓴다
// - 글자를 적었으면 + 는 바로 넣기(제출)
// - 비어 있으면 + 를 눌러 카메라와 음성을 옆으로 펼친다 (다시 누르면 접힘, + 가 x 모양으로 돈다)
// - 말하는 동안에는 펼친 채로 두어 멈추기 버튼이 보이게 한다
// - 버튼 터치 영역은 42x42로 맞춘다
// - 펼친 뒤 버튼 밖을 누르면 다시 + 로 접는다

import React, { useEffect, useRef, useState } from 'react';
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
  'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-[#6B46C1] transition-colors active:bg-[#E6DFF7]';

const InputAddActions: React.FC<InputAddActionsProps> = ({
  canSubmit,
  isSubmitting = false,
  submitLabel,
  onCamera,
  speech,
  keepFocus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [isOpen]);
  const isTrayVisible = speech.isListening || (isOpen && !canSubmit);

  return (
    <div ref={rootRef} className="flex shrink-0 items-center">
      <div
        className={`flex items-center overflow-hidden transition-[max-width,opacity] duration-200 ease-out motion-reduce:transition-none ${
          isTrayVisible ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
        }`}
        inert={!isTrayVisible}
      >
        <button
          type="button"
          aria-label="사진으로 찾기"
          onClick={() => {
            setIsOpen(false);
            onCamera();
          }}
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
              speech.isListening ? 'bg-[#6B46C1] text-white' : ''
            }`}
          >
            {speech.isListening && (
              <span className="absolute inset-0 rounded-xl bg-[#6B46C1]/40 motion-safe:animate-ping" />
            )}
            <MicIcon size={18} className="relative" />
          </button>
        )}
      </div>
      {canSubmit ? (
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
      ) : (
        <button
          type="button"
          aria-label={
            isTrayVisible ? '사진, 음성 접기' : '사진이나 음성으로 넣기'
          }
          aria-expanded={isTrayVisible}
          onClick={() => {
            if (speech.isListening) speech.stop();
            setIsOpen(open => !open);
          }}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#6B46C1] transition-colors active:bg-[#E6DFF7]"
        >
          <PlusIcon
            size={20}
            className={`transition-transform duration-200 motion-reduce:transition-none ${
              isTrayVisible ? 'rotate-45' : ''
            }`}
          />
        </button>
      )}
    </div>
  );
};

export default InputAddActions;
