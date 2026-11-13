// app/components/fridge/FridgeBoard.tsx
// 냉장고 보드 컴포넌트

'use client';

import React, { useEffect, useRef, useState } from 'react';
import FridgeShelfView, {
  type ShelfTarget,
} from '@/app/components/fridge/shelves/FridgeShelfView';
import ItemDetailSheet from '@/app/components/fridge/shelves/ItemDetailSheet';
import ShelfBelow from '@/app/components/fridge/shelves/ShelfBelow';
import ShelfItemCard from '@/app/components/fridge/shelves/ShelfItemCard';
import { ApiError } from '@/app/lib/api/apiFetch';
import { track } from '@/app/lib/analytics/gtag';
import {
  useChangeShelfCount,
  useShelfSettings,
} from '@/app/lib/shelves/useShelves';
import { SHELF_VIEW_EXPERIMENT } from '@/app/lib/shelves/rules';
import { ApiSchemaError } from '@/app/lib/api/apiFetch';
import { useItems } from '@/app/lib/items/useItems';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { goToTab } from '@/app/lib/navigation/tabs';
import { useFinishWithUndo } from '@/app/lib/items/useFinishWithUndo';
import type { Category } from '@/app/lib/schemas/item';
import ActionToast from '@/app/components/common/ActionToast';
import SegmentedTabs, { SURFACE } from '@/app/components/common/SegmentedTabs';
import FridgeItem from '@/app/components/fridge/FridgeItem';
import GroceriesIcon from '@/app/components/icons/GroceriesIcon';
import FridgeQuickAdd from '@/app/components/fridge/FridgeQuickAdd';
import FridgeItemSearch, {
  CATEGORY_LABEL,
} from '@/app/components/fridge/FridgeItemSearch';
import FridgeHeader from '@/app/components/fridge/sharing/FridgeHeader';
import NotifyFirstSheet from '@/app/components/fridge/NotifyFirstSheet';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoorClosedIcon,
  RefrigeratorIcon,
  ShoppingBasket,
  SnowflakeIcon,
} from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'fridge', label: '냉장실', Icon: RefrigeratorIcon },
  { id: 'freezer', label: '냉동실', Icon: SnowflakeIcon },
  { id: 'pantry', label: '상온', Icon: GroceriesIcon },
] as const;

const goToShoppingList = () => goToTab('shoppingList');

const FridgeBoard: React.FC = () => {
  const { data: items = [], isPending, error, refetch } = useItems();
  const { data: currentFridge } = useCurrentFridge();
  const [activeCategory, setActiveCategory] = useState<Category>('fridge');
  // 선반 보기 베타: 서버가 이 냉장고에 켜 두었을 때만 선반으로 보인다. 끄고 켜기는 설정의 베타 스위치 하나로 한다
  const shelfSettings = useShelfSettings().data;
  const isShelfMode = shelfSettings?.enabled ?? false;
  const [openShelf, setOpenShelf] = useState<ShelfTarget | null>(null);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [shelfNotice, setShelfNotice] = useState('');
  const changeShelfCount = useChangeShelfCount();
  const exposed = useRef(false);
  useEffect(() => {
    if (!isShelfMode || exposed.current) return;
    exposed.current = true;
    track('experiment_exposed', {
      experiment: SHELF_VIEW_EXPERIMENT,
      variant: 'shelf',
    });
  }, [isShelfMode]);
  const changeShelf = (category: Category, action: 'add' | 'remove') => {
    setShelfNotice('');
    changeShelfCount.mutate(
      { category, action },
      {
        onError: cause =>
          setShelfNotice(
            cause instanceof ApiError &&
              (cause.body as { error?: string } | null)?.error ===
                'shelf_not_empty'
              ? '식재료가 있는 선반은 줄일 수 없어요. 먼저 옮기거나 다 먹음으로 비워 주세요'
              : '선반을 바꾸지 못했어요. 다시 시도해 주세요',
          ),
      },
    );
  };
  // 선반을 열었으면 그 칸과 선반의 품목만 보여 주고, 거기서 넣은 품목은 그 선반에 놓는다
  const shownCategory =
    isShelfMode && openShelf ? openShelf.category : activeCategory;
  const { notice, isNoticeVisible, finish, eatSome, undo, notify } =
    useFinishWithUndo();
  // 방금 추가한 카드를 잠깐 강조한다. 칸을 옮겼다 돌아왔을 때 다시 강조되지 않게 비운다
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const activeLabel = CATEGORY_TABS.find(
    tab => tab.id === activeCategory,
  )?.label;
  const filteredItems = items.filter(
    item =>
      item.category === shownCategory &&
      !item.finished &&
      (!isShelfMode || !openShelf || item.shelf === openShelf.shelf),
  );
  const detailItem = items.find(item => item.id === detailId) ?? null;
  const unfinishedItems = items.filter(item => !item.finished);
  // 찾기로 옮겨 간 카드. 칸을 바꾼 뒤 그려지면 화면 가운데로 옮기고 잠깐 강조한다
  const [jumpedId, setJumpedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // 여러 개를 찾으면 칸과 상관없이 찾은 품목만 모아 보여 준다 (예: 냉장실 달걀과 냉동실 계란말이)
  const [found, setFound] = useState<{ query: string; ids: string[] } | null>(
    null,
  );
  const foundItems = found
    ? unfinishedItems.filter(item => found.ids.includes(item.id))
    : [];
  const isShowingFound = found !== null && foundItems.length > 0;
  const shownItems = isShowingFound ? foundItems : filteredItems;
  const jumpTo = (item: { id: string; category: Category }) => {
    setFound(null);
    if (item.category !== activeCategory) {
      setActiveCategory(item.category);
      setNewItemId(null);
    }
    // 같은 카드를 다시 찾아도 강조가 다시 보이도록 한 번 비웠다가 넣는다
    setJumpedId(null);
    requestAnimationFrame(() => setJumpedId(item.id));
  };
  useEffect(() => {
    if (!jumpedId) return;
    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    document.getElementById(`fridge-item-${jumpedId}`)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  }, [jumpedId, activeCategory]);
  const handleRebuy = (name: string) => {
    shoppingListStorage.addToShoppingList(name);
    notify({
      subject: name,
      message: '리스트에 담았어요',
      canUndo: false,
      goToList: true,
    });
  };
  return (
    <div className="relative flex h-full flex-col p-4 sm:p-6">
      <FridgeHeader
        trailing={
          // 문 앞(다음 단계의 가족 게시판 자리)을 다시 보려면 문을 닫는다
          isShelfMode && doorsOpen && !openShelf ? (
            <button
              type="button"
              onClick={() => {
                setDoorsOpen(false);
                track('fridge_doors_closed');
              }}
              className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-[#6B46C1] pr-3.5 pl-3 text-sm font-semibold whitespace-nowrap text-white shadow-[0_4px_14px_rgba(107,70,193,0.35)] transition-colors hover:bg-[#603fad]"
            >
              <DoorClosedIcon size={16} className="shrink-0" />문 닫기
            </button>
          ) : undefined
        }
      />
      <NotifyFirstSheet />
      {/* 선반 목록에서는 오른쪽 끝에 냉장고로 돌아가는 버튼 하나만 둔다 (어느 선반인지는 냉장고에서 눌러 들어와 알고 있다) */}
      {isShelfMode && openShelf && (
        <button
          type="button"
          onClick={() => setOpenShelf(null)}
          className="mb-3 flex h-10 items-center gap-1 self-end rounded-full bg-[#F1EDFA] pr-4 pl-3 text-sm font-semibold text-[#553C9A] transition-colors hover:bg-[#E6DFF7]"
        >
          <ChevronLeftIcon size={16} className="shrink-0" />
          냉장고로 돌아가기
        </button>
      )}
      {!isShelfMode && (
        <SegmentedTabs
          tabs={CATEGORY_TABS}
          activeId={activeCategory}
          onChange={id => {
            setActiveCategory(id);
            setNewItemId(null);
            setFound(null);
          }}
          className="mb-4"
        />
      )}
      <div className="-mx-2 flex-1 overflow-y-auto px-2 pt-1">
        {/* 칸을 바꿀 때 내용이 갑자기 바뀌지 않도록 살짝 나타나게 한다 */}
        <div
          key={`${shownCategory}-${openShelf?.shelf ?? 'all'}-${isShelfMode}`}
          className="motion-safe:animate-tab-fade"
        >
          {isPending ? (
            <div className={`px-4 py-12 text-center ${SURFACE}`}>
              <p className="text-sm text-gray-500">불러오는 중...</p>
            </div>
          ) : error ? (
            <div className={`px-4 py-12 text-center ${SURFACE}`}>
              <p className="mb-3 text-sm text-gray-800">
                {error instanceof ApiSchemaError
                  ? '데이터 형식이 맞지 않아요.'
                  : '냉장고를 불러오지 못했어요.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="h-10 rounded-xl bg-[#6B46C1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#603fad]"
              >
                다시 시도
              </button>
            </div>
          ) : isShelfMode && !openShelf && shelfSettings ? (
            <>
              <FridgeShelfView
                items={items}
                counts={shelfSettings.counts}
                onOpenShelf={target => {
                  setOpenShelf(target);
                  setFound(null);
                  setNewItemId(null);
                }}
                onAddShelf={category => changeShelf(category, 'add')}
                onRemoveShelf={category => changeShelf(category, 'remove')}
                isChanging={changeShelfCount.isPending}
                notice={shelfNotice}
                isOpen={doorsOpen}
                onOpenChange={setDoorsOpen}
              />
              {currentFridge && (
                <div className="mt-4">
                  <ShelfBelow
                    items={items}
                    fridgeId={currentFridge.id}
                    onOpenItem={item => {
                      setOpenShelf({
                        category: item.category,
                        shelf: item.shelf,
                      });
                      setFound(null);
                      setNewItemId(item.id);
                    }}
                    onAddToList={names => {
                      names.forEach(name =>
                        shoppingListStorage.addToShoppingList(name),
                      );
                      notify({
                        subject: names.join(', '),
                        message: '리스트에 담았어요',
                        canUndo: false,
                        goToList: true,
                      });
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {filteredItems.length === 0 && (
                <div className="px-1 pt-8 pb-5 text-center">
                  <p className="text-base font-semibold text-gray-800">
                    아직 비어 있어요
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {isShelfMode && openShelf
                      ? `이 선반에 둔 식재료를 적어 주세요`
                      : `지금 ${activeLabel}에 있는 식재료를 적어 주세요`}
                  </p>
                </div>
              )}
              {/* 비어 있다가 첫 품목이 생겨도 입력 포커스가 유지되도록 같은 자리에 둔다 */}
              <FridgeQuickAdd
                category={shownCategory}
                shelf={
                  isShelfMode && openShelf?.shelf ? openShelf.shelf : undefined
                }
                items={items}
                alwaysShowSuggestions={filteredItems.length === 0}
                onAdded={setNewItemId}
                onRebuy={handleRebuy}
                fridgeName={currentFridge?.name}
                onShowCategory={(category, message) => {
                  // 넣은 품목이 다른 칸에 들어갔으면 그 칸을 열어, 넣었는데 안 보인다고 느끼지 않게 한다
                  setActiveCategory(category);
                  setNewItemId(null);
                  setFound(null);
                  notify({ message, canUndo: false });
                }}
              />
              {/* 선반 목록에서는 장보기와 음성 찾기를 숨긴다 (돌아가기는 위 오른쪽 끝) */}
              {isShelfMode && openShelf ? null : (
                <>
                  {/* 새로 산 품목이 리스트를 거쳐야 구매 기록이 쌓이므로 등록 입력 바로 아래에서 안내한다 */}
                  <button
                    type="button"
                    onClick={goToShoppingList}
                    className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#F1EDFA] px-4 text-sm font-semibold whitespace-nowrap text-[#553C9A] transition-colors hover:bg-[#E6DFF7]"
                  >
                    <ShoppingBasket size={18} className="shrink-0" />
                    쇼핑 리스트에 담으러 가기
                    <ChevronRightIcon size={16} className="shrink-0" />
                  </button>
                  {/* 지금 칸이 비어 있으면 찾을 것이 없어 음성 찾기를 숨긴다 */}
                  {filteredItems.length > 0 && (
                    <FridgeItemSearch
                      items={unfinishedItems}
                      query={searchQuery}
                      onQueryChange={setSearchQuery}
                      onJump={jumpTo}
                      jumpedId={jumpedId}
                      onAddToList={handleRebuy}
                      onShowMany={(list, query) => {
                        setJumpedId(null);
                        setFound({ query, ids: list.map(item => item.id) });
                      }}
                    />
                  )}
                </>
              )}
              {isShowingFound && (
                <div className="mt-4 flex items-center justify-between gap-2 px-1">
                  <p className="min-w-0 text-sm font-semibold text-gray-800">
                    ‘{found.query}’ 찾은 품목 {foundItems.length}개
                  </p>
                  <button
                    type="button"
                    onClick={() => setFound(null)}
                    className="flex h-[42px] shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-medium text-[#553C9A] active:bg-[#F1EDFA]"
                  >
                    <ChevronLeftIcon size={16} />
                    전체 리스트로 돌아가기
                  </button>
                </div>
              )}
              <div
                className={`mt-3 grid grid-cols-1 md:grid-cols-2 ${isShelfMode ? 'gap-2' : 'gap-4'}`}
              >
                {shownItems.map(item => (
                  <div
                    key={item.id}
                    id={`fridge-item-${item.id}`}
                    className={
                      item.id === jumpedId
                        ? 'motion-safe:animate-item-added scroll-mt-4 rounded-2xl'
                        : 'scroll-mt-4'
                    }
                  >
                    {/* 모아 보기에서는 어느 칸에 있는지 함께 보여 준다 */}
                    {isShowingFound && (
                      <p className="mb-1.5 px-1 text-xs font-medium text-gray-500">
                        {CATEGORY_LABEL[item.category]}
                      </p>
                    )}
                    {isShelfMode && shelfSettings ? (
                      <ShelfItemCard
                        item={item}
                        shelfCount={shelfSettings.counts[item.category]}
                        isNew={item.id === newItemId}
                        onFinish={kind => finish(item, kind)}
                        onEatSome={count => eatSome(item, count)}
                        onOpenDetail={() => setDetailId(item.id)}
                      />
                    ) : (
                      <FridgeItem
                        item={item}
                        isNew={item.id === newItemId}
                        onFinish={kind => finish(item, kind)}
                        onEatSome={count => eatSome(item, count)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {isShelfMode && shelfSettings && (
        <ItemDetailSheet
          item={detailItem}
          shelfCount={shelfSettings.counts[detailItem?.category ?? 'fridge']}
          onClose={() => setDetailId(null)}
          onDiscard={item => finish(item, 'discarded')}
        />
      )}
      <ActionToast
        isVisible={isNoticeVisible}
        subject={notice?.subject}
        message={notice?.message ?? ''}
        actionLabel={
          notice?.canUndo
            ? '되돌리기'
            : notice?.goToList
              ? '리스트 보기'
              : undefined
        }
        onAction={notice?.canUndo ? undo : goToShoppingList}
      />
    </div>
  );
};
export default FridgeBoard;
