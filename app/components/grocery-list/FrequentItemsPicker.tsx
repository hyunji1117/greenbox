'use client';
// app/components/grocery-list/FrequentItemsPicker.tsx
// 장보기 리스트 아래의 식재료 담기: 이름으로 찾거나 사진을 눌러 리스트에 담는다 (다시 누르면 빼기, 수량은 리스트에서)
// 찾는 식재료가 사진 목록에 없으면 적은 이름 그대로 담는다 (리스트 위 입력창을 이곳으로 합침)
// 종류마다 6~16개라 옆으로 넘기지 않고 격자로 한 번에 보여 준다

import React, { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Plus, SearchIcon, XIcon } from 'lucide-react';
import InputAddActions from '@/app/components/common/InputAddActions';
import PhotoAddSheet from '@/app/components/fridge/PhotoAddSheet';
import SegmentedTabs, { SURFACE } from '@/app/components/common/SegmentedTabs';
import { mockItems, type FridgeItem } from '@/app/data/mockItems';
import { findByName } from '@/app/lib/items/nameMatch';
import { ITEM_NAME_MAX } from '@/app/lib/schemas/item';
import { useVoiceFoodName } from '@/app/lib/speech/useVoiceFoodName';
import VoiceCheckNotice from '@/app/components/common/VoiceCheckNotice';

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
  // 담은 카드를 다시 누르면 리스트에서 뺀다 (수량은 위쪽 리스트에서 바꾼다)
  onUnpick: (name: string) => void;
  // 사진에서 찾아 고른 식재료를 한 번에 담는다
  onPickMany: (items: { name: string; quantity: number }[]) => void;
  // 리스트에 이미 담긴 수량 (이름 기준)
  quantities: Map<string, number>;
  // 이 기기에서 구매 완료한 횟수 (이름 기준)
  purchaseCounts: Map<string, number>;
}

const FrequentItemsPicker: React.FC<FrequentItemsPickerProps> = ({
  onPick,
  onUnpick,
  onPickMany,
  quantities,
  purchaseCounts,
}) => {
  const [activeCategory, setActiveCategory] =
    useState<CatalogCategory>('vegetables');
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // 사진으로 담기: 사진 속 식재료를 찾아 골라서 리스트에 한 번에 담는다
  const cameraRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const keyword = query.trim();
  // 찾는 동안에는 종류와 상관없이 이름에 들어간 식재료를 모두 보여 준다 (탭에 없는 기타 품목 포함)
  const items = useMemo(
    () =>
      keyword
        ? findByName(mockItems, keyword)
        : mockItems.filter(item => item.category === activeCategory),
    [keyword, activeCategory],
  );
  const hasExactMatch = items.some(item => item.name === keyword);
  // 말한 이름은 다 들은 뒤 식재료 이름인지 확인하고 찾기 칸에 넣는다 (잘못 들은 말이 그대로 담기지 않게)
  const voice = useVoiceFoodName({ onAccept: setQuery });
  const speech = voice.speech;

  const addTyped = () => {
    if (!keyword) return;
    onPick(keyword);
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-base font-semibold">식재료 담기</h2>
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
          placeholder="식재료 직접 입력 (예: 오이)"
          maxLength={ITEM_NAME_MAX}
          enterKeyHint="done"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && !speech.isListening && (
          <button
            type="button"
            aria-label="찾기 지우기"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-gray-400 active:bg-gray-100"
          >
            <XIcon size={18} />
          </button>
        )}
        <InputAddActions
          canSubmit={Boolean(keyword) && !speech.isListening}
          submitLabel="적은 이름 리스트에 추가하기"
          onCamera={() => cameraRef.current?.click()}
          speech={speech}
        />
      </form>
      {/* 휴대폰에서는 뒤쪽 카메라를 바로 열고, PC에서는 사진 파일을 고른다 */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={event => {
          const file = event.target.files?.[0] ?? null;
          // 같은 사진을 다시 골라도 변경으로 잡히도록 비운다
          event.target.value = '';
          if (file) setPhoto(file);
        }}
      />
      <PhotoAddSheet
        file={photo}
        onClose={() => setPhoto(null)}
        onRetake={() => cameraRef.current?.click()}
        onPickToList={onPickMany}
        onAdded={() => setPhoto(null)}
      />
      {/* 화면 읽기 프로그램에도 듣는 중과 오류를 알린다 */}
      <div className="-mt-1 mb-3">
        <VoiceCheckNotice
          isListening={speech.isListening}
          heard={voice.heard}
          check={voice.check}
          error={speech.error}
          onRetry={speech.start}
          onAcceptHeard={voice.acceptHeard}
          listeningHint="식재료 이름을 말해 주세요"
        />
      </div>

      {keyword ? (
        // 사진 목록에 똑같은 이름이 없으면 적은 이름 그대로 담을 수 있게 맨 위에 둔다
        !hasExactMatch && (
          <button
            type="button"
            onClick={addTyped}
            className={`mb-3 flex min-h-12 w-full items-center gap-2 px-4 text-left text-sm font-medium text-[#553C9A] ${SURFACE}`}
          >
            <Plus size={18} className="shrink-0" />
            <span className="min-w-0 truncate">‘{keyword}’ 리스트에 추가하기</span>
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
          const isPicked = (quantities.get(item.name) ?? 0) > 0;
          const purchaseCount = purchaseCounts.get(item.name) ?? 0;
          return (
            <li key={item.id} className="relative">
              <button
                type="button"
                aria-label={
                  isPicked
                    ? `${item.name} 담음, 누르면 리스트에서 빼기`
                    : `${item.name} 리스트에 담기`
                }
                aria-pressed={isPicked}
                onClick={() =>
                  isPicked ? onUnpick(item.name) : onPick(item.name)
                }
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
                  {isPicked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#4B2F8C]/45">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#553C9A] shadow-md">
                        <Check size={24} strokeWidth={3} aria-hidden />
                      </span>
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
