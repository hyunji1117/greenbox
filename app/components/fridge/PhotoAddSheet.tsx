'use client';
// app/components/fridge/PhotoAddSheet.tsx
// 여러 식재료를 한 번에 넣는 시트. 두 가지로 연다
// - 사진: 찍은 사진에서 찾은 식재료 후보를 보여 준다 (인식은 틀릴 수 있어 바로 넣지 않고 고친 뒤 넣는다)
// - 구매 완료: 장보기에서 산 식재료를 냉장고에 넣기 전에 보여 준다 (initial)
// 줄마다 이름, 보관 칸, 수량을 고치고, 잘못 찾은 것은 ×로 지우고, 빠진 것은 맨 아래에서 직접 추가한다
// 선반 보기에서는 줄마다 추천 자리를 미리 채워 두고, 자리 표시(›)를 누르면 "○○! 어디에 넣을까요?"에서 바꾼다 (2026-11-20)

import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  CameraIcon,
  ChevronRightIcon,
  Loader2Icon,
  MapPinIcon,
  XIcon,
} from 'lucide-react';
import QuantityStepper from '@/app/components/common/QuantityStepper';
import BottomSheet from '@/app/components/common/BottomSheet';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import PlaceSheet, {
  findExisting,
} from '@/app/components/fridge/shelves/PlaceSheet';
import { ApiError, apiFetch } from '@/app/lib/api/apiFetch';
import { useAddPurchasedItems } from '@/app/lib/items/useItems';
import {
  ITEM_NAME_MAX,
  QUANTITY_MAX,
  type Category,
  type Item,
} from '@/app/lib/schemas/item';
import {
  RecognizeResponseSchema,
  type RecognizedItem,
} from '@/app/lib/schemas/recognize';
import type { ShelfCounts } from '@/app/lib/shelves/rules';
import { recommendPlace, shelfPlaceName } from '@/app/lib/shelves/recommend';
import { prepareImage } from '@/app/lib/vision/resizeImage';

const CATEGORY_LABELS: Record<Category, string> = {
  fridge: '냉장',
  freezer: '냉동',
  pantry: '상온',
};

interface Candidate extends RecognizedItem {
  key: number;
  // 직접 고른 선반. 없으면 추천 자리에 넣는다
  shelf: number | null;
  // 구매 완료로 열었을 때 장보기 항목 id (넣은 항목만 리스트에서 빼기 위해)
  sourceId?: string;
}

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503)
      return '사진으로 찾기는 아직 준비 중이에요. 이름을 적어 등록해 주세요';
    if (error.status === 429)
      return '잠시 뒤에 다시 찍어 주세요. 짧은 시간에 너무 많이 찾았어요';
    if (error.status === 400)
      return '이 사진은 읽을 수 없어요. 다시 찍어 주세요';
  }
  return '식재료를 찾지 못했어요. 다시 찍어 주세요';
}

interface PhotoAddSheetProps {
  // 찍은 사진. null이면 사진으로는 열려 있지 않다
  file: File | null;
  // 구매 완료로 열 때 넣을 식재료. null이면 구매 완료로는 열려 있지 않다
  initial?: { id: string; name: string; quantity: number }[] | null;
  onClose: () => void;
  onRetake?: () => void;
  // 냉장고에 넣었을 때는 넣은 품목의 칸과 (구매 완료면) 넣은 장보기 항목 id도 넘긴다
  onAdded: (
    count: number,
    categories?: Category[],
    savedIds?: string[],
  ) => void;
  // 장보기에서 쓰면 냉장고에 넣지 않고 리스트에 담는다 (보관 위치는 고르지 않는다)
  onPickToList?: (items: { name: string; quantity: number }[]) => void;
  // 선반 보기일 때 자리를 정하기 위한 칸별 선반 수와 지금 품목. 없으면 자리를 묻지 않는다
  placeCounts?: ShelfCounts;
  items?: Item[];
}

let nextKey = 1000;

const PhotoAddSheet: React.FC<PhotoAddSheetProps> = ({
  file,
  initial = null,
  onClose,
  onRetake,
  onAdded,
  onPickToList,
  placeCounts,
  items = [],
}) => {
  const isList = Boolean(onPickToList);
  const isPurchase = initial !== null;
  const askPlace = Boolean(placeCounts) && !isList;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasPartialFailure, setHasPartialFailure] = useState(false);
  const [extraName, setExtraName] = useState('');
  const [editingKey, setEditingKey] = useState<number | null>(null);
  // 같은 사진을 두 번 보내지 않는다 (개발 모드에서 화면 효과가 두 번 실행돼도 사용료가 두 번 들지 않게)
  const requestedFileRef = useRef<File | null>(null);
  const addItems = useAddPurchasedItems(isPurchase ? 'purchase' : 'photo');
  const recognize = useMutation({
    mutationFn: async (photo: File) => {
      const image = await prepareImage(photo);
      return apiFetch('/api/items/recognize', RecognizeResponseSchema, {
        method: 'POST',
        body: { image: image.base64, mediaType: image.mediaType },
      });
    },
    onSuccess: ({ items: found }) =>
      setCandidates(
        found.map((item, index) => ({ ...item, key: index, shelf: null })),
      ),
  });
  const { mutate: startRecognize } = recognize;

  // 새 사진을 찍을 때마다 다시 찾는다
  useEffect(() => {
    if (!file || requestedFileRef.current === file) return;
    requestedFileRef.current = file;
    setCandidates([]);
    setHasPartialFailure(false);
    startRecognize(file);
  }, [file, startRecognize]);

  // 구매 완료로 열면 산 식재료를 그대로 후보로 둔다 (칸은 냉장실로 시작하고 고칠 수 있다)
  useEffect(() => {
    if (!initial) return;
    setHasPartialFailure(false);
    setCandidates(
      initial.map((entry, index) => ({
        name: entry.name,
        quantity: Math.min(entry.quantity, QUANTITY_MAX),
        category: 'fridge',
        key: index,
        shelf: null,
        sourceId: entry.id,
      })),
    );
  }, [initial]);

  const update = (key: number, changes: Partial<Candidate>) =>
    setCandidates(prev =>
      prev.map(c => (c.key === key ? { ...c, ...changes } : c)),
    );
  const remove = (key: number) =>
    setCandidates(prev => prev.filter(c => c.key !== key));
  const addExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const name = extraName.trim();
    if (!name) return;
    nextKey += 1;
    setCandidates(prev => [
      ...prev,
      { name, quantity: 1, category: 'fridge', key: nextKey, shelf: null },
    ]);
    setExtraName('');
  };

  // 직접 고른 자리가 없으면 추천 자리
  const placeOf = (c: Candidate): number | undefined =>
    placeCounts
      ? (c.shelf ??
        recommendPlace(c.name.trim(), c.category, placeCounts, items).shelf)
      : undefined;

  const chosen = candidates.filter(c => c.name.trim());
  const editing = candidates.find(c => c.key === editingKey) ?? null;

  const addChosen = async () => {
    if (chosen.length === 0 || addItems.isPending) return;
    if (onPickToList) {
      onPickToList(
        chosen.map(c => ({ name: c.name.trim(), quantity: c.quantity })),
      );
      onAdded(chosen.length);
      return;
    }
    const saved = await addItems
      .mutateAsync(
        chosen.map(c => ({
          name: c.name.trim(),
          category: c.category,
          quantity: c.quantity,
          ...(askPlace ? { shelf: placeOf(c) } : {}),
        })),
      )
      .catch(() => null);
    if (!saved) {
      setHasPartialFailure(true);
      return;
    }
    // 넣지 못한 품목만 남겨 다시 시도할 수 있게 한다
    const failedKeys = new Set(
      chosen.filter((_, index) => !saved[index]).map(c => c.key),
    );
    const savedOnes = chosen.filter((_, index) => saved[index]);
    if (failedKeys.size === 0) {
      onAdded(
        savedOnes.length,
        savedOnes.map(c => c.category),
        savedOnes.flatMap(c => (c.sourceId ? [c.sourceId] : [])),
      );
      return;
    }
    if (isPurchase && savedOnes.length > 0) {
      // 넣은 것은 장보기 리스트에서 바로 빼 두고, 남은 것만 다시 시도하게 한다
      onAdded(
        savedOnes.length,
        savedOnes.map(c => c.category),
        savedOnes.flatMap(c => (c.sourceId ? [c.sourceId] : [])),
      );
    }
    setCandidates(prev => prev.filter(c => failedKeys.has(c.key)));
    setHasPartialFailure(true);
  };

  const title = isPurchase
    ? '산 식재료 넣기'
    : isList
      ? '사진으로 담기'
      : '사진으로 등록';
  // 사진에서 하나라도 찾았으면 다 지워도 목록(직접 추가 칸 포함)을 그대로 둔다
  const showList =
    isPurchase || (recognize.isSuccess && recognize.data.items.length > 0);

  return (
    <BottomSheet
      isOpen={file !== null || isPurchase}
      title={title}
      onClose={onClose}
    >
      {!isPurchase && recognize.isPending ? (
        <div className="flex flex-col items-center gap-3 py-10 text-sm text-gray-600">
          <Loader2Icon
            size={28}
            className="text-[#6B46C1] motion-safe:animate-spin"
          />
          사진에서 식재료를 찾고 있어요
        </div>
      ) : !isPurchase && recognize.isError ? (
        <div className="py-6 text-center">
          <p role="alert" className="text-sm text-balance text-gray-700">
            {errorText(recognize.error)}
          </p>
          {/* 기능이 꺼져 있으면 다시 찍어도 같으므로 다시 찍기를 보이지 않는다 */}
          {!(
            recognize.error instanceof ApiError &&
            recognize.error.status === 503
          ) &&
            onRetake && <RetakeButton onClick={onRetake} />}
        </div>
      ) : !isPurchase && !showList && recognize.isSuccess ? (
        <div className="py-6 text-center">
          <p className="text-sm text-balance text-gray-700">
            사진에서 식재료를 찾지 못했어요. 조금 더 가까이 찍어 주세요
          </p>
          {onRetake && <RetakeButton onClick={onRetake} />}
        </div>
      ) : (
        <>
          <p className="mb-3 px-1 text-center text-sm text-gray-600">
            {isList
              ? '틀린 것은 지우고, 이름과 수량은 고칠 수 있어요'
              : askPlace
                ? '틀린 것은 지우고, 자리는 눌러서 바꿀 수 있어요'
                : '틀린 것은 지우고, 이름과 보관 위치, 수량은 고칠 수 있어요'}
          </p>
          <ul className="space-y-2">
            {candidates.map(c => {
              const shelf = placeOf(c);
              return (
                <li key={c.key} className={`p-2 ${SURFACE}`}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => remove(c.key)}
                      aria-label={`${c.name} 지우기`}
                      className="flex h-11 w-9 shrink-0 items-center justify-center"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F4F4F8] text-gray-500">
                        <XIcon size={14} />
                      </span>
                    </button>
                    {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 쓴다 */}
                    <input
                      value={c.name}
                      onChange={e => update(c.key, { name: e.target.value })}
                      maxLength={ITEM_NAME_MAX}
                      aria-label="식재료 이름"
                      className="h-10 min-w-0 flex-1 rounded-lg bg-transparent px-1 text-base font-medium text-gray-800 focus:bg-[#F4F4F8] focus:outline-none"
                    />
                  </div>
                  {/* 냉장고에 같은 이름이 이미 있으면 알린다 (들어간 줄 모르고 또 넣지 않게. 필요 없으면 ×로 지운다) */}
                  {!isList && findExisting(c.name.trim(), items) && (
                    <p className="pl-10 text-xs font-medium text-amber-700">
                      냉장고에 이미 있어요. 같은 거면 ×로 빼 주세요
                    </p>
                  )}
                  <div
                    className={`mt-1 flex items-center gap-2 pl-10 ${isList ? 'justify-end' : 'justify-between'}`}
                  >
                    {!isList && (
                      <div
                        role="radiogroup"
                        aria-label={`${c.name} 보관 위치`}
                        className="flex rounded-xl bg-[#F4F4F8] p-0.5"
                      >
                        {(Object.keys(CATEGORY_LABELS) as Category[]).map(
                          cat => (
                            <button
                              key={cat}
                              type="button"
                              role="radio"
                              aria-checked={c.category === cat}
                              // 칸을 바꾸면 그 칸의 추천 자리로 다시 잡는다
                              onClick={() =>
                                update(c.key, { category: cat, shelf: null })
                              }
                              className={`h-8 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                                c.category === cat
                                  ? 'bg-white text-[#553C9A] shadow-sm'
                                  : 'text-gray-500'
                              }`}
                            >
                              {CATEGORY_LABELS[cat]}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                    <QuantityStepper
                      value={c.quantity}
                      onChange={quantity => update(c.key, { quantity })}
                      label={`${c.name} 수량`}
                      max={QUANTITY_MAX}
                      size="sm"
                    />
                  </div>
                  {askPlace && placeCounts && shelf !== undefined && (
                    <div className="mt-1.5 pl-10">
                      <button
                        type="button"
                        onClick={() => setEditingKey(c.key)}
                        aria-label={`${c.name} 자리 바꾸기, 지금 ${shelfPlaceName(c.category, shelf, placeCounts[c.category])}`}
                        className="flex h-9 w-full items-center gap-1.5 rounded-xl bg-[#F1EDFA] px-3 text-left text-xs font-semibold text-[#553C9A] ring-1 ring-[#DCD3F3]"
                      >
                        <MapPinIcon size={14} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {shelfPlaceName(
                            c.category,
                            shelf,
                            placeCounts[c.category],
                          )}
                          {c.shelf === null && ' · 추천'}
                        </span>
                        <ChevronRightIcon size={16} className="shrink-0" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {/* 인식이 놓친 식재료는 여기서 직접 더한다 */}
          <form onSubmit={addExtra} className="mt-2 flex gap-2">
            <input
              value={extraName}
              onChange={e => setExtraName(e.target.value)}
              maxLength={ITEM_NAME_MAX}
              aria-label="빠진 식재료 직접 추가"
              placeholder="빠진 식재료 직접 추가"
              className="h-11 min-w-0 flex-1 rounded-xl border border-dashed border-[#CFC8E3] bg-white px-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!extraName.trim()}
              className="h-11 shrink-0 rounded-xl bg-[#F1EDFA] px-4 text-sm font-semibold text-[#553C9A] disabled:opacity-50"
            >
              추가
            </button>
          </form>
          {hasPartialFailure && (
            <p role="alert" className="mt-2 text-center text-xs text-red-500">
              넣지 못한 품목이 있어요. 남은 품목을 다시 넣어 주세요
            </p>
          )}
          <button
            type="button"
            onClick={addChosen}
            disabled={chosen.length === 0 || addItems.isPending}
            className="mt-4 h-12 w-full rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad] disabled:opacity-50"
          >
            {addItems.isPending
              ? '넣는 중...'
              : chosen.length > 0
                ? `${chosen.length}개 ${isList ? '리스트에 담기' : '냉장고에 넣기'}`
                : '넣을 식재료가 없어요'}
          </button>
          {!isPurchase && onRetake && (
            <RetakeButton onClick={onRetake} subtle />
          )}
        </>
      )}
      {askPlace && placeCounts && (
        <PlaceSheet
          name={editing ? editing.name.trim() || '식재료' : null}
          category={editing?.category ?? 'fridge'}
          counts={placeCounts}
          items={items}
          onPlace={shelf => {
            if (editing) update(editing.key, { shelf });
            setEditingKey(null);
          }}
          onClose={() => setEditingKey(null)}
        />
      )}
    </BottomSheet>
  );
};

const RetakeButton: React.FC<{ onClick: () => void; subtle?: boolean }> = ({
  onClick,
  subtle = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`mx-auto mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium ${
      subtle ? 'text-gray-600 hover:bg-white' : 'bg-[#F1EDFA] text-[#553C9A]'
    }`}
  >
    <CameraIcon size={16} />
    다시 찍기
  </button>
);

export default PhotoAddSheet;
