'use client';
// app/components/fridge/sharing/FridgeSwitcherSheet.tsx
// 내가 속한 냉장고 목록과 전환, 지금 냉장고 이름 바꾸기
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
import { FRIDGE_NAME_MAX, type CurrentFridge } from '@/app/lib/schemas/fridge';

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
  const nameValue = nameDraft ?? current.name;
  const canSaveName =
    nameDraft !== null &&
    nameDraft.trim().length > 0 &&
    nameDraft.trim() !== current.name;

  const saveName = () => {
    if (!canSaveName || rename.isPending) return;
    rename.mutate(nameValue.trim(), { onSuccess: () => setNameDraft(null) });
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
        냉장고는 5개까지 함께 쓸 수 있어요. 다른 냉장고는 가족에게 받은 초대
        링크로 들어가요.
      </p>

      <div className={`mt-4 p-4 ${SURFACE}`}>
        <label
          htmlFor="fridge-name"
          className="mb-1 block text-xs font-medium text-gray-500"
        >
          지금 냉장고 이름
        </label>
        <div className="flex gap-2">
          {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 쓴다 */}
          <input
            id="fridge-name"
            value={nameValue}
            maxLength={FRIDGE_NAME_MAX}
            onChange={event => setNameDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') saveName();
            }}
            className="h-11 min-w-0 flex-1 rounded-xl bg-[#F4F4F8] px-3 text-base text-gray-700 focus:ring-1 focus:ring-[#A794D6] focus:outline-none"
          />
          <button
            type="button"
            onClick={saveName}
            disabled={!canSaveName || rename.isPending}
            className="h-11 shrink-0 rounded-xl bg-[#6B46C1] px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            저장
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          함께 보는 사람 모두에게 같은 이름으로 보여요
        </p>
        {rename.isError && (
          <p className="mt-1 text-xs text-red-500">이름을 저장하지 못했어요.</p>
        )}
      </div>
    </BottomSheet>
  );
};

export default FridgeSwitcherSheet;
