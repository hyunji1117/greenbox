'use client';
// app/components/fridge/sharing/FridgeSwitcherSheet.tsx
// 내가 속한 냉장고 목록과 전환, 지금 냉장고 이름 바꾸기 (함께 보는 사람은 나에게만 보이는 이름)
// 예: 자취방 냉장고는 평소에, 본가 냉장고는 주말에 바꿔 가며 본다

import React, { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import BottomSheet from '@/app/components/common/BottomSheet';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import {
  useMyFridges,
  useRenameFridge,
  useSwitchFridge,
} from '@/app/lib/fridges/useFridgeSharing';
import {
  FRIDGE_LABEL_MAX,
  FRIDGE_NAME_SUFFIX,
  toFridgeLabel,
  type CurrentFridge,
} from '@/app/lib/schemas/fridge';

interface FridgeSwitcherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  current: CurrentFridge;
}

const FridgeSwitcherSheet: React.FC<FridgeSwitcherSheetProps> = ({
  isOpen,
  onClose,
  current,
}) => {
  const fridges = useMyFridges(isOpen);
  const switchFridge = useSwitchFridge();
  const rename = useRenameFridge(current.id);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  // 이름은 "앞 이름 + 냉장고"이고 칸에는 앞 이름만 쓴다
  // 이름을 바꾼 적이 없으면 칸을 비우고 지금 보이는 앞 이름(예: 떡자)을 예시로 보여 준다
  const savedLabel = current.hasCustomName ? toFridgeLabel(current.name) : '';
  const placeholder = current.hasCustomName
    ? undefined
    : toFridgeLabel(current.name);
  const nameValue = nameDraft ?? savedLabel;
  // 만든 사람은 냉장고 이름을, 함께 보는 사람은 자기 화면에서만 보이는 이름을 바꾼다
  const isOwner = current.role === 'owner';
  const canSaveName =
    nameDraft !== null &&
    toFridgeLabel(nameDraft).length > 0 &&
    toFridgeLabel(nameDraft) !== savedLabel;

  const saveName = () => {
    if (!canSaveName || rename.isPending) return;
    rename.mutate(toFridgeLabel(nameValue), {
      onSuccess: () => setNameDraft(null),
    });
  };

  return (
    <BottomSheet isOpen={isOpen} title="냉장고 바꾸기" onClose={onClose}>
      <ul className={`divide-y divide-gray-100 ${SURFACE}`}>
        {fridges.isPending && (
          <li className="p-4 text-sm text-gray-500">불러오는 중...</li>
        )}
        {fridges.error && (
          <li className="p-4 text-sm text-red-500">
            목록을 불러오지 못했어요.
          </li>
        )}
        {fridges.data?.map(fridge => {
          const isCurrent = fridge.id === current.id;
          return (
            <li key={fridge.id}>
              <button
                type="button"
                disabled={switchFridge.isPending}
                aria-current={isCurrent}
                onClick={() =>
                  isCurrent
                    ? onClose()
                    : switchFridge.mutate(fridge.id, { onSuccess: onClose })
                }
                className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-gray-900">
                    {fridge.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {fridge.memberCount === 1
                      ? '혼자 쓰는 중'
                      : `${fridge.memberCount}명이 함께 보는 중`}
                  </span>
                </span>
                {isCurrent && (
                  <CheckIcon size={20} className="shrink-0 text-[#553C9A]" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {switchFridge.isError && (
        <p className="mt-2 text-sm text-red-500">
          냉장고를 바꾸지 못했어요. 다시 시도해 주세요.
        </p>
      )}
      <p className="mt-2 px-1 text-xs text-gray-500">
        냉장고는 5개까지 함께 쓸 수 있어요. 다른 냉장고는 초대받은 링크로
        들어가요.
      </p>

      <div className={`mt-4 p-4 ${SURFACE}`}>
        <p className="mb-1 text-xs font-medium text-gray-500">
          {isOwner ? '냉장고 이름' : '내가 부를 이름'}
        </p>
        <div className="flex gap-2">
          {/* 쓴 글자 바로 뒤에 "냉장고"가 따라붙어 "본가 냉장고"처럼 한 이름으로 읽히게 한다
              입력칸 너비는 보이지 않는 같은 글자로 맞춘다. 칸 어디를 눌러도 입력된다 */}
          <label
            htmlFor="fridge-name"
            className="flex h-11 min-w-0 flex-1 cursor-text items-center overflow-hidden rounded-xl bg-[#F4F4F8] px-3 text-base focus-within:ring-1 focus-within:ring-[#A794D6]"
          >
            <span className="inline-grid min-w-0">
              <span
                aria-hidden
                className="invisible col-start-1 row-start-1 whitespace-pre"
              >
                {nameValue || placeholder || ' '}
              </span>
              {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 쓴다 */}
              <input
                id="fridge-name"
                value={nameValue}
                placeholder={placeholder}
                maxLength={FRIDGE_LABEL_MAX}
                // 기본 너비(20자)를 없애 숨은 글자 너비에 맞춘다
                size={1}
                aria-describedby="fridge-name-suffix fridge-name-hint"
                onChange={event => setNameDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') saveName();
                }}
                className="col-start-1 row-start-1 w-full min-w-[1ch] bg-transparent text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
            </span>
            <span
              id="fridge-name-suffix"
              className="shrink-0 pl-1.5 text-gray-700"
            >
              {FRIDGE_NAME_SUFFIX}
            </span>
          </label>
          <button
            type="button"
            onClick={saveName}
            disabled={!canSaveName || rename.isPending}
            className="h-11 shrink-0 rounded-xl bg-[#6B46C1] px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            저장
          </button>
        </div>
        <p
          id="fridge-name-hint"
          className="mt-1 flex justify-between gap-2 text-xs text-gray-400"
        >
          <span>
            {isOwner
              ? '예: 본가, 자취방. 함께 보는 사람 모두에게 이 이름으로 보여요'
              : '예: 엄마, 본가. 나에게만 보이는 이름이에요'}
          </span>
          <span className="shrink-0 tabular-nums">
            {toFridgeLabel(nameValue).length}/{FRIDGE_LABEL_MAX}
          </span>
        </p>
        {rename.isError && (
          <p className="mt-1 text-xs text-red-500">이름을 저장하지 못했어요.</p>
        )}
      </div>
    </BottomSheet>
  );
};

export default FridgeSwitcherSheet;
