'use client';
// app/components/common/MarqueeText.tsx
// 한 줄에 다 들어가지 않는 글자를 말줄임표로 자르지 않고, 전광판처럼 오른쪽에서 왼쪽으로 흘려 끝까지 읽게 한다
// 친구 가족 테스트(2026-11-11): 음성 바에서 긴 문구가 '…'로 잘려 무슨 말인지 알 수 없었음
// - 넘칠 때만 움직이고, 다 들어가면 그대로 둔다
// - 움직임 줄이기 설정을 켠 사람에게는 움직이지 않고 두 줄까지 줄바꿈해 보여 준다

import React, { useLayoutEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
}

// 1초에 움직일 거리(px). 읽을 수 있는 속도로, 처음과 끝에서는 잠깐 멈춘다(키프레임)
const SPEED_PX_PER_SEC = 40;
const MIN_DURATION_SEC = 5;

export function marqueeDuration(overflowPx: number): number {
  // 움직이는 구간이 전체의 60%라 그만큼 늘려 잡는다
  return Math.max(MIN_DURATION_SEC, overflowPx / SPEED_PX_PER_SEC / 0.6);
}

const MarqueeText: React.FC<MarqueeTextProps> = ({ text, className = '' }) => {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = textRef.current;
    if (!box || !inner) return;
    const measure = () =>
      setOverflow(Math.max(0, inner.scrollWidth - box.clientWidth));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text]);

  const isMoving = overflow > 0;
  return (
    <span
      ref={boxRef}
      data-overflowing={isMoving || undefined}
      // 넘치면 가운데 정렬 대신 왼쪽부터 보여 줘야 시작 글자가 잘리지 않는다
      className={`block min-w-0 overflow-hidden ${isMoving ? 'text-left' : ''}`}
    >
      <span
        ref={textRef}
        // 움직임 줄이기: 움직이지 않고 두 줄까지 줄바꿈
        className={`inline-block whitespace-nowrap ${className} ${
          isMoving
            ? 'motion-safe:animate-marquee motion-reduce:line-clamp-2 motion-reduce:whitespace-normal'
            : ''
        }`}
        style={
          isMoving
            ? ({
                '--marquee-distance': `-${overflow}px`,
                animationDuration: `${marqueeDuration(overflow)}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
};

export default MarqueeText;
