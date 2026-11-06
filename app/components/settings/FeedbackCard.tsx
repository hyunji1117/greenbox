'use client';
// app/components/settings/FeedbackCard.tsx
// 의견 보내기. 글자로 쓰거나 말로 남길 수 있다 (말은 브라우저가 글자로 바꾸고, 고친 뒤 보낸다)
// 보낼 때 따로 동의를 받는다 (방침 2026-11-06). 음성 파일은 보내지 않는다

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { MessageSquareHeartIcon, MicIcon, SquareIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import BottomSheet from '@/app/components/common/BottomSheet';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { useSpeechInput } from '@/app/lib/speech/useSpeechInput';
import {
  FEEDBACK_TEXT_MAX,
  type CreateFeedback,
} from '@/app/lib/schemas/feedback';

const NoContent = z.null();

const FeedbackCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [usedVoice, setUsedVoice] = useState(false);
  const [isSent, setIsSent] = useState(false);
  // 말하기 시작할 때 이미 써 둔 글. 인식된 말은 그 뒤에 붙인다
  const baseRef = useRef('');
  const speech = useSpeechInput(spoken => {
    const base = baseRef.current;
    setText((base ? `${base} ` : '') + spoken);
  });
  const send = useMutation({
    mutationFn: (input: CreateFeedback) =>
      apiFetch('/api/feedback', NoContent, { method: 'POST', body: input }),
    onSuccess: () => {
      setText('');
      setUsedVoice(false);
      setIsSent(true);
    },
  });

  const startVoice = () => {
    baseRef.current = text.trim();
    setUsedVoice(true);
    speech.start();
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    speech.stop();
    send.mutate({
      text: trimmed.slice(0, FEEDBACK_TEXT_MAX),
      inputMethod: usedVoice ? 'voice' : 'text',
      page: 'settings',
      agreed: true,
    });
  };

  const close = () => {
    speech.stop();
    setIsOpen(false);
    setIsSent(false);
    send.reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex w-full items-center gap-3 p-4 text-left ${SURFACE}`}
      >
        <MessageSquareHeartIcon size={20} className="shrink-0 text-[#6B46C1]" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-800">
            의견 보내기
          </span>
          <span className="block text-xs text-gray-500">
            불편한 점이나 바라는 점을 글이나 말로 알려 주세요
          </span>
        </span>
      </button>

      <BottomSheet isOpen={isOpen} title="의견 보내기" onClose={close}>
        {isSent ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-700">
              보내 주셔서 고마워요. 꼼꼼히 읽고 반영할게요.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-4 h-11 rounded-xl bg-[#F1EDFA] px-6 text-sm font-semibold text-[#553C9A]"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 17px로 쓴다 */}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={FEEDBACK_TEXT_MAX}
              rows={5}
              aria-label="의견 내용"
              placeholder="예: 유통기한 알림이 너무 일찍 와요"
              className="w-full resize-none rounded-xl bg-white p-3 text-[17px] text-gray-800 ring-1 ring-black/10 placeholder:text-gray-400 focus:ring-2 focus:ring-[#A794D6] focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
              <span>
                {speech.isListening
                  ? '듣고 있어요. 다 말했으면 멈춤을 눌러 주세요'
                  : speech.error === 'denied'
                    ? '마이크 권한이 없어요. 기기 설정에서 허용해 주세요'
                    : speech.error
                      ? '말을 알아듣지 못했어요. 다시 해 주세요'
                      : ''}
              </span>
              <span className="tabular-nums">
                {text.length}/{FEEDBACK_TEXT_MAX}
              </span>
            </div>
            {speech.isSupported && (
              <button
                type="button"
                onClick={speech.isListening ? speech.stop : startVoice}
                className={`mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium ${
                  speech.isListening
                    ? 'bg-red-50 text-red-600'
                    : 'bg-white text-[#553C9A] ring-1 ring-black/10'
                }`}
              >
                {speech.isListening ? (
                  <>
                    <SquareIcon size={16} /> 멈춤
                  </>
                ) : (
                  <>
                    <MicIcon size={16} /> 말로 남기기
                  </>
                )}
              </button>
            )}
            <p className="mt-3 px-1 text-xs text-gray-500">
              보낸 내용은 서비스 개선에만 쓰고 1년 뒤 지워요. 운영자 메일로 모아
              보기 위해 Resend(미국)를 거쳐요.{' '}
              <Link href="/privacy" className="underline underline-offset-2">
                개인정보처리방침
              </Link>
            </p>
            {send.isError && (
              <p role="alert" className="mt-2 text-xs text-red-500">
                보내지 못했어요. 잠시 뒤에 다시 시도해 주세요.
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || send.isPending}
              className="mt-3 h-12 w-full rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad] disabled:opacity-50"
            >
              {send.isPending ? '보내는 중...' : '동의하고 보내기'}
            </button>
          </>
        )}
      </BottomSheet>
    </>
  );
};

export default FeedbackCard;
