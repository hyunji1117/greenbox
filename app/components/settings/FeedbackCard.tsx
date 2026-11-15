'use client';
// app/components/settings/FeedbackCard.tsx
// 의견 보내기. 글자로 쓰거나 말로 남길 수 있다 (말은 브라우저가 글자로 바꾸고, 고친 뒤 보낸다)
// 보낼 때 따로 동의를 받는다 (방침 2026-11-06). 음성 파일은 보내지 않는다
// 말로 남길 때는 "동의하고 말로 보내기"를 누르는 순간 동의를 받고, 말이 끝나면 3초 뒤 저절로 보낸다
// (키보드 음성 입력과 달리 손을 대지 않아도 보내지게. 잘못 알아들었으면 3초 안에 고치기를 누른다)
// 보낸 뒤 고마움 화면은 4초 뒤 저절로 닫힌다

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageSquareHeartIcon, MicIcon, SquareIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import BottomSheet from '@/app/components/common/BottomSheet';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { track } from '@/app/lib/analytics/gtag';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { useSpeechInput } from '@/app/lib/speech/useSpeechInput';
import {
  FEEDBACK_TEXT_MAX,
  type CreateFeedback,
} from '@/app/lib/schemas/feedback';

const NoContent = z.null();

export const AUTO_SEND_SECONDS = 3;
export const THANKS_CLOSE_SECONDS = 4;

// 1초마다 줄어드는 남은 초. active가 꺼지면 멈추고, 0이 되면 onDone을 한 번 부른다
function useCountdown(active: boolean, seconds: number, onDone: () => void) {
  const [left, setLeft] = useState(seconds);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (!active) return;
    setLeft(seconds);
    let remaining = seconds;
    const timer = window.setInterval(() => {
      remaining -= 1;
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        onDoneRef.current();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, seconds]);
  return left;
}

const FeedbackCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [usedVoice, setUsedVoice] = useState(false);
  const [isSent, setIsSent] = useState(false);
  // 말로 보내기를 눌렀는지(동의 포함), 말이 끝나 저절로 보내기를 기다리는 중인지
  const [voiceSend, setVoiceSend] = useState(false);
  const [autoSendPending, setAutoSendPending] = useState(false);
  const sentAutoRef = useRef(false);
  // 말하기 시작할 때 이미 써 둔 글. 인식된 말은 그 뒤에 붙인다
  const baseRef = useRef('');
  const speech = useSpeechInput(spoken => {
    const base = baseRef.current;
    setText((base ? `${base} ` : '') + spoken);
  });
  const send = useMutation({
    mutationFn: (input: CreateFeedback) =>
      apiFetch('/api/feedback', NoContent, { method: 'POST', body: input }),
    onSuccess: (_, input) => {
      track('feedback_sent', {
        input: input.inputMethod,
        auto: sentAutoRef.current,
      });
      setText('');
      setUsedVoice(false);
      setIsSent(true);
    },
  });

  const startVoice = () => {
    baseRef.current = text.trim();
    setUsedVoice(true);
    setVoiceSend(true);
    setAutoSendPending(false);
    speech.start();
  };

  // 말이 끝나면(듣기가 멈추면) 알아들은 글이 있을 때만 저절로 보내기를 시작한다
  const wasListeningRef = useRef(false);
  useEffect(() => {
    const ended = wasListeningRef.current && !speech.isListening;
    wasListeningRef.current = speech.isListening;
    if (ended && voiceSend && !speech.error && text.trim()) {
      setAutoSendPending(true);
    }
  }, [speech.isListening, speech.error, voiceSend, text]);

  const stopAutoSend = () => {
    setAutoSendPending(false);
    setVoiceSend(false);
  };

  const submit = (auto = false) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    sentAutoRef.current = auto;
    setAutoSendPending(false);
    setVoiceSend(false);
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
    stopAutoSend();
    send.reset();
  };

  const autoSendLeft = useCountdown(autoSendPending, AUTO_SEND_SECONDS, () =>
    submit(true),
  );
  const thanksLeft = useCountdown(
    isOpen && isSent,
    THANKS_CLOSE_SECONDS,
    close,
  );

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
          <div className="pt-6 text-center">
            <p role="status" className="text-sm leading-relaxed text-gray-700">
              보내 주셔서 고마워요.
              <br />
              꼼꼼히 읽고 반영할게요.
            </p>
            {/* 보내기 버튼과 같은 모양. 누르지 않아도 남은 초가 지나면 저절로 닫힌다 */}
            <button
              type="button"
              onClick={close}
              className="mt-6 h-12 w-full rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad]"
            >
              확인 ({thanksLeft})
            </button>
          </div>
        ) : (
          <>
            {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 17px로 쓴다 */}
            <textarea
              value={text}
              onChange={e => {
                setText(e.target.value);
                // 글을 고치기 시작하면 저절로 보내지 않는다
                if (autoSendPending) stopAutoSend();
              }}
              maxLength={FEEDBACK_TEXT_MAX}
              rows={5}
              aria-label="의견 내용"
              placeholder="예: 유통기한 알림이 너무 일찍 와요"
              className="w-full resize-none rounded-xl bg-white p-3 text-[17px] text-gray-800 ring-1 ring-black/10 placeholder:text-gray-400 focus:ring-2 focus:ring-[#A794D6] focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
              <span>
                {speech.isListening
                  ? '듣고 있어요. 말을 마치면 3초 뒤 저절로 보내요'
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
            {autoSendPending && (
              <div
                role="status"
                className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-[#F1EDFA] py-2 pr-2 pl-3 text-sm text-[#553C9A]"
              >
                <span className="font-semibold">
                  {autoSendLeft}초 뒤 보내요
                </span>
                <span className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={stopAutoSend}
                    className="h-10 rounded-lg bg-white px-3 font-medium ring-1 ring-black/10"
                  >
                    고치기
                  </button>
                  <button
                    type="button"
                    onClick={() => submit(true)}
                    className="h-10 rounded-lg bg-[#6B46C1] px-3 font-semibold text-white"
                  >
                    지금 보내기
                  </button>
                </span>
              </div>
            )}
            {speech.isSupported && !autoSendPending && (
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
                    <MicIcon size={16} /> 동의하고 말로 보내기
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
              onClick={() => submit()}
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
