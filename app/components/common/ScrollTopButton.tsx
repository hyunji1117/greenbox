'use client';
// app/components/common/ScrollTopButton.tsx
// 맨 위로 가는 떠 있는 버튼. 기준 요소(페이지 머리말)가 화면 위로 사라지면 오른쪽 아래에 나타난다
// 화면을 감싼 스크롤 영역이 어디든 동작하도록 스크롤 위치 대신 기준 요소가 보이는지로 판단한다

import React, { useEffect, useState } from 'react';
import { ArrowUpIcon } from 'lucide-react';

interface ScrollTopButtonProps {
  target: React.RefObject<HTMLElement | null>;
}

const ScrollTopButton: React.FC<ScrollTopButtonProps> = ({ target }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = target.current;
    // 지원하지 않는 오래된 브라우저에서는 버튼을 띄우지 않는다
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) =>
      // 아래로 내려가서 머리말이 화면 위쪽으로 빠졌을 때만 보인다
      setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    // 기준 요소를 감싼 것 중 실제로 내려가 있는 스크롤 영역을 맨 위로 올린다
    let scroller = target.current?.parentElement ?? null;
    while (scroller && scroller.scrollTop === 0) {
      scroller = scroller.parentElement;
    }
    (scroller ?? document.scrollingElement)?.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="맨 위로"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      // 하단 메뉴(휴대폰은 바닥에 붙고, 넓은 화면은 떠 있음) 바로 위에 둔다
      className={`fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#553C9A] shadow-[0_6px_20px_rgba(45,25,90,0.22)] ring-1 ring-black/5 transition-[opacity,transform] duration-200 ease-out md:right-6 md:bottom-32 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <ArrowUpIcon size={22} />
    </button>
  );
};

export default ScrollTopButton;
