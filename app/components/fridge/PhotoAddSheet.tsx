'use client';
// app/components/fridge/PhotoAddSheet.tsx
// 찍은 사진에서 찾은 식재료 후보를 보여 주고, 맞는 것만 골라 한 번에 냉장고에 넣는다
// 인식은 틀릴 수 있으므로 바로 넣지 않고, 이름과 보관 위치와 수량을 고친 뒤 넣게 한다

import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CameraIcon, Check, Loader2Icon } from 'lucide-react';
import QuantityStepper from '@/app/components/common/QuantityStepper';
import BottomSheet from '@/app/components/common/BottomSheet';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { ApiError, apiFetch } from '@/app/lib/api/apiFetch';
import { useAddPurchasedItems } from '@/app/lib/items/useItems';
import {
  ITEM_NAME_MAX,
  QUANTITY_MAX,
  type Category,
} from '@/app/lib/schemas/item';
import {
  RecognizeResponseSchema,
  type RecognizedItem,
} from '@/app/lib/schemas/recognize';
import { prepareImage } from '@/app/lib/vision/resizeImage';

const CATEGORY_LABELS: Record<Category, string> = {
  fridge: '냉장',
  freezer: '냉동',
  pantry: '상온',
};

interface Candidate extends RecognizedItem {
  key: number;
  selected: boolean;
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
  // 찍은 사진. null이면 닫혀 있다
  file: File | null;
  onClose: () => void;
  onRetake: () => void;
  onAdded: (count: number) => void;
  // 장보기에서 쓰면 냉장고에 넣지 않고 리스트에 담는다 (보관 위치는 고르지 않는다)
  onPickToList?: (items: { name: string; quantity: number }[]) => void;
}

const PhotoAddSheet: React.FC<PhotoAddSheetProps> = ({
  file,
  onClose,
  onRetake,
  onAdded,
  onPickToList,
}) => {
  const isList = Boolean(onPickToList);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasPartialFailure, setHasPartialFailure] = useState(false);
  // 같은 사진을 두 번 보내지 않는다 (개발 모드에서 화면 효과가 두 번 실행돼도 사용료가 두 번 들지 않게)
  const requestedFileRef = useRef<File | null>(null);
  const addItems = useAddPurchasedItems('photo');
  const recognize = useMutation({
    mutationFn: async (photo: File) => {
      const image = await prepareImage(photo);
      return apiFetch('/api/items/recognize', RecognizeResponseSchema, {
        method: 'POST',
        body: { image: image.base64, mediaType: image.mediaType },
      });
    },
    onSuccess: ({ items }) =>
      setCandidates(
        items.map((item, index) => ({ ...item, key: index, selected: true })),
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

  const update = (key: number, changes: Partial<Candidate>) =>
    setCandidates(prev =>
      prev.map(c => (c.key === key ? { ...c, ...changes } : c)),
    );

  const chosen = candidates.filter(c => c.selected && c.name.trim());

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
    const count = saved.filter(Boolean).length;
    if (failedKeys.size === 0) {
      onAdded(count);
      return;
    }
    setCandidates(prev => prev.filter(c => failedKeys.has(c.key)));
    setHasPartialFailure(true);
  };

  return (
    <BottomSheet
      isOpen={file !== null}
      title={isList ? '사진으로 담기' : '사진으로 등록'}
      onClose={onClose}
    >
      {recognize.isPending ? (
        <div className="flex flex-col items-center gap-3 py-10 text-sm text-gray-600">
          <Loader2Icon
            size={28}
            className="text-[#6B46C1] motion-safe:animate-spin"
          />
          사진에서 식재료를 찾고 있어요
        </div>
      ) : recognize.isError ? (
        <div className="py-6 text-center">
          <p role="alert" className="text-sm text-balance text-gray-700">
            {errorText(recognize.error)}
          </p>
          {/* 기능이 꺼져 있으면 다시 찍어도 같으므로 다시 찍기를 보이지 않는다 */}
          {!(
            recognize.error instanceof ApiError &&
            recognize.error.status === 503
          ) && <RetakeButton onClick={onRetake} />}
        </div>
      ) : recognize.isSuccess && candidates.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-balance text-gray-700">
            사진에서 식재료를 찾지 못했어요. 조금 더 가까이 찍어 주세요
          </p>
          <RetakeButton onClick={onRetake} />
        </div>
      ) : (
        <>
          <p className="mb-3 px-1 text-sm text-gray-600">
            {isList
              ? '맞는 것만 골라 주세요. 이름과 수량은 고칠 수 있어요'
              : '맞는 것만 골라 주세요. 이름과 보관 위치, 수량은 고칠 수 있어요'}
          </p>
          <ul className="space-y-2">
            {candidates.map(c => (
              <li key={c.key} className={`p-2 ${SURFACE}`}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => update(c.key, { selected: !c.selected })}
                    aria-pressed={c.selected}
                    aria-label={`${c.name} 넣기 선택`}
                    className="flex h-11 w-9 shrink-0 items-center justify-center"
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                        c.selected
                          ? 'bg-[#6B46C1] text-white'
                          : 'bg-white ring-1 ring-gray-300'
                      }`}
                    >
                      {c.selected && <Check size={14} />}
                    </span>
                  </button>
                  {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 쓴다 */}
                  <input
                    value={c.name}
                    onChange={e => update(c.key, { name: e.target.value })}
                    maxLength={ITEM_NAME_MAX}
                    aria-label="식재료 이름"
                    className={`h-10 min-w-0 flex-1 rounded-lg bg-transparent px-1 text-base font-medium focus:bg-[#F4F4F8] focus:outline-none ${
                      c.selected ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div
                  className={`mt-1 flex items-center gap-2 pl-10 ${isList ? 'justify-end' : 'justify-between'}`}
                >
                  {!isList && (
                    <div
                      role="radiogroup"
                      aria-label={`${c.name} 보관 위치`}
                      className="flex rounded-xl bg-[#F4F4F8] p-0.5"
                    >
                      {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          role="radio"
                          aria-checked={c.category === cat}
                          onClick={() => update(c.key, { category: cat })}
                          className={`h-8 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                            c.category === cat
                              ? 'bg-white text-[#553C9A] shadow-sm'
                              : 'text-gray-500'
                          }`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </button>
                      ))}
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
              </li>
            ))}
          </ul>
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
                : '넣을 식재료를 골라 주세요'}
          </button>
          <RetakeButton onClick={onRetake} subtle />
        </>
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
