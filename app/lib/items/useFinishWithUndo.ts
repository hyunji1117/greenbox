// app/lib/items/useFinishWithUndo.ts
// 소진 처리와 되돌리기 안내. 카드는 낙관적 반영으로 바로 사라지므로 목록 쪽에서 결과를 알린다

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUpdateItem } from '@/app/lib/items/useItems';
import { track } from '@/app/lib/analytics/gtag';

export type FinishKind = 'eaten' | 'discarded';

// 친구 가족 테스트(2026-11-11): 5초는 안내를 읽고 되돌리기를 누르기에 짧았다는 의견으로 8초로 늘림
export const UNDO_WINDOW_MS = 8000;

// 품목 이름 뒤에 바로 붙어도 조사가 틀리지 않는 문구만 쓴다
const FINISH_MESSAGE: Record<FinishKind, string> = {
  eaten: '다 먹었어요',
  discarded: '버렸어요',
};

export interface FinishNotice {
  // 품목 이름. 길면 이 부분만 줄여서 문구는 끝까지 보이게 한다
  subject?: string;
  message: string;
  canUndo: boolean;
  goToList?: boolean;
}

export function useFinishWithUndo() {
  const { mutateAsync } = useUpdateItem();
  // 닫히는 동안에도 내용이 보여야 해서 안내 내용과 표시 여부를 나눈다
  const [notice, setNotice] = useState<FinishNotice | null>(null);
  const [isNoticeVisible, setIsNoticeVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // 되돌릴 때 보낼 값까지 함께 기억한다 (다 먹음과 개수별 먹음이 되돌리는 값이 다르다)
  const lastRef = useRef<{
    id: string;
    saved: Promise<boolean>;
    revert: { finished?: boolean; eatenQuantity?: number };
  } | null>(null);

  const show = useCallback((next: FinishNotice) => {
    clearTimeout(timerRef.current);
    setNotice(next);
    setIsNoticeVisible(true);
    timerRef.current = setTimeout(
      () => setIsNoticeVisible(false),
      UNDO_WINDOW_MS,
    );
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const finish = useCallback(
    (
      item: {
        id: string;
        name: string;
        quantity: number;
        eatenQuantity: number;
      },
      kind: FinishKind,
    ) => {
      // 다 먹으면 먹은 개수를 처음 산 수량으로 채운다. 버리면 먹은 개수는 그대로 둔다
      const saved = mutateAsync({
        id: item.id,
        updates:
          kind === 'eaten'
            ? { finished: true, eatenQuantity: item.quantity }
            : { finished: true },
      }).then(
        () => true,
        () => false,
      );
      lastRef.current = {
        id: item.id,
        saved,
        revert: { finished: false, eatenQuantity: item.eatenQuantity },
      };
      show({
        subject: item.name,
        message: FINISH_MESSAGE[kind],
        canUndo: true,
      });
      void saved.then(ok => {
        if (ok) track('item_finished', { kind });
        if (!ok) {
          show({
            message: '저장하지 못했어요. 다시 눌러 주세요',
            canUndo: false,
          });
        }
      });
    },
    [mutateAsync, show],
  );

  // 계란, 양파처럼 일부만 먹었을 때. 처음 산 수량은 그대로 두고 먹은 개수만 늘린다
  const eatSome = useCallback(
    (
      item: { id: string; name: string; eatenQuantity: number },
      count: number,
    ) => {
      const saved = mutateAsync({
        id: item.id,
        updates: { eatenQuantity: item.eatenQuantity + count },
      }).then(
        () => true,
        () => false,
      );
      lastRef.current = {
        id: item.id,
        saved,
        revert: { eatenQuantity: item.eatenQuantity },
      };
      show({
        subject: item.name,
        message: `${count}개 먹었어요`,
        canUndo: true,
      });
      void saved.then(ok => {
        if (ok) track('item_partly_eaten', { count });
        if (!ok) {
          show({
            message: '저장하지 못했어요. 다시 눌러 주세요',
            canUndo: false,
          });
        }
      });
    },
    [mutateAsync, show],
  );

  const undo = useCallback(async () => {
    const last = lastRef.current;
    if (!last) return;
    lastRef.current = null;
    clearTimeout(timerRef.current);
    setIsNoticeVisible(false);
    // 소진 요청이 끝난 뒤에 보내서 늦게 도착한 소진 요청이 되돌리기를 덮어쓰지 않게 한다
    if (!(await last.saved)) return;
    try {
      await mutateAsync({ id: last.id, updates: last.revert });
      track('item_finish_undone');
    } catch {
      show({
        message: '되돌리지 못했어요. 잠시 후 다시 확인해 주세요',
        canUndo: false,
      });
    }
  }, [mutateAsync, show]);

  return { notice, isNoticeVisible, finish, eatSome, undo, notify: show };
}
