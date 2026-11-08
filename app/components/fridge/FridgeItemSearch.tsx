'use client';
// app/components/fridge/FridgeItemSearch.tsx
// 냉장고 품목 찾기. 품목이 많으면 손으로 내리며 찾기 오래 걸려, 말하면 그 카드로 바로 옮겨 간다
// - 음성 인식을 지원하면 누르면 바로 듣는 음성 바를, 지원하지 않는 브라우저에서는 글자 입력창을 보인다
// - 냉장고에 없으면 장볼 리스트에 담을지 묻는다
// - 다른 칸(냉동실, 상온)에 있으면 그 칸으로 바꾼 뒤 옮겨 간다
// - 말하는 동안 결과가 바뀌어 화면이 흔들리지 않게, 말이나 입력이 잠깐 멈춘 뒤에 옮겨 간다

import React, { useEffect, useMemo, useRef } from 'react';
import { MicIcon, SearchIcon, ShoppingBasket, XIcon } from 'lucide-react';
import VoiceSearchBar from '@/app/components/fridge/VoiceSearchBar';
import { SPEECH_ERROR_TEXT } from '@/app/components/grocery-list/FrequentItemsPicker';
import { ITEM_NAME_MAX, type Category } from '@/app/lib/schemas/item';
import { useSpeechInput } from '@/app/lib/speech/useSpeechInput';

export interface SearchableItem {
  id: string;
  name: string;
  category: Category;
}

const CATEGORY_LABEL: Record<Category, string> = {
  fridge: '냉장실',
  freezer: '냉동실',
  pantry: '상온',
};

// 이름 뒤 조사(이/가)를 고르기 위한 받침 확인. 한글이 아니면 받침 없음으로 본다
const hasFinalConsonant = (name: string) => {
  const code = name.charCodeAt(name.length - 1);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
};

// 띄어쓰기와 대소문자를 무시하고 찾는다 ("방울 토마토"로 말해도 "방울토마토"를 찾음)
const normalize = (text: string) => text.replace(/\s+/g, '').toLowerCase();

export function findItems<T extends SearchableItem>(items: T[], query: string) {
  const keyword = normalize(query);
  if (!keyword) return [];
  const matches = items.filter(item => normalize(item.name).includes(keyword));
  // 이름이 똑같거나 앞부분이 같은 품목을 먼저
  return matches.sort((a, b) => {
    const score = (item: T) => {
      const name = normalize(item.name);
      return name === keyword ? 0 : name.startsWith(keyword) ? 1 : 2;
    };
    return score(a) - score(b);
  });
}

export const JUMP_DELAY_MS = 400;

interface FridgeItemSearchProps<T extends SearchableItem> {
  items: T[];
  // 칸을 바꾸면 아래 내용을 새로 그리므로, 찾는 글자는 바깥에서 들고 있는다
  query: string;
  onQueryChange: (query: string) => void;
  onJump: (item: T) => void;
  // 이미 옮겨 간 품목. 칸을 바꿔 다시 그려질 때 같은 품목으로 또 옮겨 가지 않게 한다
  jumpedId: string | null;
  // 냉장고에 없는 이름을 장볼 리스트에 담는다
  onAddToList?: (name: string) => void;
}

function FridgeItemSearch<T extends SearchableItem>({
  items,
  query,
  onQueryChange: setQuery,
  onJump,
  jumpedId,
  onAddToList,
}: FridgeItemSearchProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const speech = useSpeechInput(text => setQuery(text.slice(0, ITEM_NAME_MAX)));
  const matches = useMemo(() => findItems(items, query), [items, query]);
  const onJumpRef = useRef(onJump);
  useEffect(() => {
    onJumpRef.current = onJump;
  }, [onJump]);

  const firstId = matches[0]?.id;
  useEffect(() => {
    if (!firstId || firstId === jumpedId) return;
    const timer = setTimeout(() => {
      const first = matches.find(item => item.id === firstId);
      if (first) onJumpRef.current(first);
    }, JUMP_DELAY_MS);
    return () => clearTimeout(timer);
    // 첫 결과가 바뀔 때만 옮겨 간다 (같은 품목을 다시 찾을 때는 아래 버튼으로)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstId]);

  const keyword = query.trim();

  return (
    <div className="mt-3">
      {speech.isSupported ? (
        // 음성으로 찾는 것이 기본이라 입력창 대신 누르면 바로 듣는 음성 바를 둔다
        <VoiceSearchBar
          isListening={speech.isListening}
          text={query}
          onStart={() => {
            setQuery('');
            speech.start();
          }}
          onStop={speech.stop}
          onClear={() => setQuery('')}
        />
      ) : (
        <form
          role="search"
          onSubmit={event => {
            event.preventDefault();
            if (matches[0]) onJump(matches[0]);
            inputRef.current?.blur();
          }}
          className="flex h-11 items-center gap-1 rounded-2xl bg-white pr-1 pl-3.5 ring-1 ring-black/5 focus-within:ring-[#A794D6]"
        >
          <SearchIcon
            size={16}
            className="shrink-0 text-gray-400"
            aria-hidden
          />
          {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 유지한다 */}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            aria-label="냉장고에서 품목 찾기"
            placeholder="품목 찾기 (말로 찾아도 돼요)"
            maxLength={ITEM_NAME_MAX}
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent pl-1.5 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {speech.isSupported && (
            <button
              type="button"
              aria-label={
                speech.isListening ? '음성 찾기 멈추기' : '말로 품목 찾기'
              }
              aria-pressed={speech.isListening}
              onClick={speech.isListening ? speech.stop : speech.start}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
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
              onClick={() => setQuery('')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100"
            >
              <XIcon size={16} />
            </button>
          )}
        </form>
      )}
      <div aria-live="polite" className="px-1 text-xs empty:hidden">
        {/* 듣는 중이라는 것은 음성 바가 보여 주므로 여기서는 오류만 알린다 */}
        {speech.error && !speech.isListening ? (
          <p className="mt-1.5 text-red-500">
            {SPEECH_ERROR_TEXT[speech.error]}
          </p>
        ) : null}
      </div>
      {/* 냉장고에 없으면 다음에 할 일(장볼 리스트에 담기)을 바로 고를 수 있게 한다 */}
      {keyword && matches.length === 0 && !speech.isListening && (
        <div
          role="status"
          className="mt-3 flex flex-col items-center gap-2 rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-black/5"
        >
          <p className="text-sm text-gray-700">
            냉장고에 ‘{keyword}’{hasFinalConsonant(keyword) ? '이' : '가'}{' '}
            없어요. 장볼 리스트에 담을까요?
          </p>
          {onAddToList && (
            <button
              type="button"
              onClick={() => {
                onAddToList(keyword);
                setQuery('');
              }}
              className="flex h-[42px] items-center gap-1.5 rounded-xl bg-[#6B46C1] px-4 text-sm font-semibold text-white active:bg-[#553C9A]"
            >
              <ShoppingBasket size={16} />
              장볼 리스트에 담기
            </button>
          )}
        </div>
      )}
      {/* 같은 이름이 여러 칸에 있거나 비슷한 이름이 많으면 골라서 옮겨 간다 */}
      {matches.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matches.slice(0, 8).map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onJump(item)}
              className="flex h-9 items-center rounded-full bg-[#F1EDFA] px-3 text-sm font-medium text-[#553C9A] hover:bg-[#E6DFF7]"
            >
              {item.name}
              <span className="ml-1 text-xs font-normal text-[#7A68B0]">
                {CATEGORY_LABEL[item.category]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FridgeItemSearch;
