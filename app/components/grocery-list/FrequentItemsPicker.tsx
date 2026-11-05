'use client';
// app/components/grocery-list/FrequentItemsPicker.tsx
// 장보기 리스트 아래의 식재료 담기: 이름으로 찾거나 사진을 눌러 리스트에 담는다
// 찾는 식재료가 사진 목록에 없으면 적은 이름 그대로 담는다 (리스트 위 입력창을 이곳으로 합침)
// 종류마다 6~16개라 옆으로 넘기지 않고 격자로 한 번에 보여 준다

import React, { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { MicIcon, Plus, SearchIcon, XIcon } from 'lucide-react';
import SegmentedTabs, { SURFACE } from '@/app/components/common/SegmentedTabs';
import { mockItems, type FridgeItem } from '@/app/data/mockItems';
import { ITEM_NAME_MAX } from '@/app/lib/schemas/item';
import {
  useSpeechInput,
  type SpeechError,
} from '@/app/lib/speech/useSpeechInput';

const SPEECH_ERROR_TEXT: Record<SpeechError, string> = {
  denied: '마이크 사용이 막혀 있어요. 브라우저 설정에서 마이크를 허용해 주세요',
  'no-speech': '말소리를 듣지 못했어요. 다시 눌러 말해 주세요',
  failed: '음성으로 찾지 못했어요. 글자로 찾아 주세요',
};

const CATEGORY_TABS = [
  { id: 'vegetables', label: '채소' },
  { id: 'fruits', label: '과일' },
  { id: 'meat', label: '고기' },
  { id: 'seafood', label: '해산물' },
] as const;

type CatalogCategory = (typeof CATEGORY_TABS)[number]['id'];

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';
const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

function imageUrl(item: FridgeItem): string {
  try {
    return decodeURIComponent(item.imageUrl);
  } catch {
    return item.imageUrl;
  }
}

interface FrequentItemsPickerProps {
  onPick: (name: string) => void;
  // 리스트에 이미 담긴 수량 (이름 기준)
  quantities: Map<string, number>;
  // 이 기기에서 구매 완료한 횟수 (이름 기준)
  purchaseCounts: Map<string, number>;
}

const FrequentItemsPicker: React.FC<FrequentItemsPickerProps> = ({
  onPick,
  quantities,
  purchaseCounts,
}) => {
  const [activeCategory, setActiveCategory] =
    useState<CatalogCategory>('vegetables');
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const keyword = query.trim();
  // 찾는 동안에는 종류와 상관없이 이름에 들어간 식재료를 모두 보여 준다 (탭에 없는 기타 품목 포함)
  const items = useMemo(
    () =>
      keyword
        ? mockItems.filter(item => item.name.includes(keyword))
        : mockItems.filter(item => item.category === activeCategory),
    [keyword, activeCategory],
  );
  const hasExactMatch = items.some(item => item.name === keyword);
  // 말한 내용을 검색어로 넣는다. 말하는 동안에도 결과가 바로 바뀐다
  const speech = useSpeechInput(text => setQuery(text.slice(0, ITEM_NAME_MAX)));

  const addTyped = () => {
    if (!keyword) return;
    onPick(keyword);
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold">식재료 담기</h2>
      <p className="mt-0.5 mb-3 text-sm text-gray-500">
        찾거나 사진을 누르면 리스트에 담겨요
      </p>
      <form
        onSubmit={event => {
          event.preventDefault();
          addTyped();
        }}
        className="mb-3 flex h-12 items-center gap-2 rounded-2xl bg-white pr-1 pl-4 shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5 transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(107,70,193,0.12)] focus-within:ring-[#A794D6]"
      >
        <SearchIcon size={18} className="shrink-0 text-gray-400" aria-hidden />
        {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 유지한다 */}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          aria-label="살 식재료 이름"
          placeholder="식재료 찾기 (예: 우유)"
          maxLength={ITEM_NAME_MAX}
          enterKeyHint="done"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {speech.isSupported && (
          <button
            type="button"
            aria-label={
              speech.isListening ? '음성 입력 멈추기' : '음성으로 찾기'
            }
            aria-pressed={speech.isListening}
            onClick={speech.isListening ? speech.stop : speech.start}
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
              speech.isListening
                ? 'bg-[#6B46C1] text-white'
                : 'text-[#6B46C1] hover:bg-[#F1EDFA]'
            }`}
          >
            {speech.isListening && (
              <span className="absolute inset-0 rounded-xl bg-[#6B46C1]/40 motion-safe:animate-ping" />
            )}
            <MicIcon size={18} className="relative" />
          </button>
        )}
        {query && !speech.isListening && (
          <button
            type="button"
            aria-label="찾기 지우기"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100"
          >
            <XIcon size={18} />
          </button>
        )}
      </form>
      {/* 화면 읽기 프로그램에도 듣는 중과 오류를 알린다 */}
      <p aria-live="polite" className="-mt-1 mb-3 px-1 text-xs empty:hidden">
        {speech.isListening ? (
          <span className="text-[#553C9A]">
            듣고 있어요. 식재료 이름을 말해 주세요
          </span>
        ) : speech.error ? (
          <span className="text-red-500">
            {SPEECH_ERROR_TEXT[speech.error]}
          </span>
        ) : null}
      </p>

      {keyword ? (
        // 사진 목록에 똑같은 이름이 없으면 적은 이름 그대로 담을 수 있게 맨 위에 둔다
        !hasExactMatch && (
          <button
            type="button"
            onClick={addTyped}
            className={`mb-3 flex min-h-12 w-full items-center gap-2 px-4 text-left text-sm font-medium text-[#553C9A] ${SURFACE}`}
          >
            <Plus size={18} className="shrink-0" />
            <span className="min-w-0 truncate">‘{keyword}’ 그대로 담기</span>
          </button>
        )
      ) : (
        <SegmentedTabs
          tabs={CATEGORY_TABS}
          activeId={activeCategory}
          onChange={setActiveCategory}
          className="mb-3"
        />
      )}
      <ul
        key={keyword ? 'search' : activeCategory}
        className="motion-safe:animate-tab-fade grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5"
      >
        {items.map(item => {
          const quantity = quantities.get(item.name) ?? 0;
          const purchaseCount = purchaseCounts.get(item.name) ?? 0;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-label={
                  quantity > 0
                    ? `${item.name} 하나 더 담기, 지금 ${quantity}개`
                    : `${item.name} 리스트에 담기`
                }
                onClick={() => onPick(item.name)}
                className={`block w-full overflow-hidden text-left ${SURFACE}`}
              >
                <span className="relative block aspect-square w-full">
                  <Image
                    src={
                      failedImages.has(item.id)
                        ? PLACEHOLDER_IMAGE
                        : imageUrl(item)
                    }
                    alt=""
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 25vw, 33vw"
                    quality={75}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    // 대체 이미지까지 실패해도 다시 그리지 않아 요청이 반복되지 않는다
                    onError={() =>
                      setFailedImages(prev =>
                        prev.has(item.id) ? prev : new Set(prev).add(item.id),
                      )
                    }
                  />
                  {purchaseCount > 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-[#6B46C1] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {purchaseCount}회
                    </span>
                  )}
                  {quantity > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#4B2F8C]/55 text-white">
                      <Plus size={20} strokeWidth={2} />
                      <span className="text-xl font-semibold">{quantity}</span>
                    </span>
                  )}
                </span>
                <span className="block truncate px-2 py-2 text-center text-sm font-semibold text-gray-800">
                  {item.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FrequentItemsPicker;
