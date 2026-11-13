'use client';
// app/components/settings/ShelfBetaCard.tsx
// 베타 기능 미리 써 보기: 선반으로 보기 (docs/decisions/0012-shelf-view-beta.md)
// 실험 허용 목록에 있는 냉장고 주인에게만 보인다. 켜면 같은 냉장고 가족 모두에게 적용되고, 끄면 바로 목록으로 돌아온다

import React from 'react';
import Collapse from '@/app/components/common/Collapse';
import Switch from '@/app/components/common/Switch';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import {
  useSetShelfView,
  useShelfSettings,
} from '@/app/lib/shelves/useShelves';

const ShelfBetaCard: React.FC = () => {
  const settings = useShelfSettings().data;
  const setShelfView = useSetShelfView();
  if (!settings?.canToggle) return null;

  return (
    <section className={`p-4 ${SURFACE}`} aria-labelledby="shelf-beta-title">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2
              id="shelf-beta-title"
              className="text-sm font-semibold text-gray-800"
            >
              베타 기능 미리 써 보기
            </h2>
            <span className="rounded-full bg-[#E6DFF7] px-2 py-0.5 text-[11px] font-bold text-[#553C9A]">
              테스트 냉장고
            </span>
          </div>
          {/* 꺼 두면 상세를 접고, 어떤 베타 기능인지만 짧게 남긴다 */}
          <Collapse isOpen={!settings.enabled}>
            <p className="mt-0.5 text-xs text-gray-500">
              냉장고를 선반 모양으로 보는 화면이에요
            </p>
          </Collapse>
        </div>
        <Switch
          checked={settings.enabled}
          label="선반으로 보기"
          disabled={setShelfView.isPending}
          onChange={enabled => setShelfView.mutate(enabled)}
        />
      </div>
      <Collapse isOpen={settings.enabled}>
        <div className="pt-3">
          <p className="text-sm font-semibold text-gray-800">선반으로 보기</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            냉장고를 선반 모양으로 보여 줘요. 이 냉장고를 같이 쓰는 가족
            모두에게 켜지고, 끄면 지금 목록으로 돌아와요. 정해 둔 선반 자리는
            그대로 남아요.
          </p>
        </div>
      </Collapse>
      {setShelfView.isError && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          바꾸지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </section>
  );
};

export default ShelfBetaCard;
