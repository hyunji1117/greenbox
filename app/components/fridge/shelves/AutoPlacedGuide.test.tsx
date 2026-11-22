// app/components/fridge/shelves/AutoPlacedGuide.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/lib/analytics/gtag', () => ({ track: vi.fn() }));

import AutoPlacedGuide from './AutoPlacedGuide';

const List: React.FC<{ onOpen: () => void; hasAutoPlaced?: boolean }> = ({
  onOpen,
  hasAutoPlaced = true,
}) => (
  <>
    <article data-auto-placed="true">
      <button type="button" data-tour="item-name" onClick={onOpen}>
        요거트
      </button>
    </article>
    <AutoPlacedGuide userId="u1" hasAutoPlaced={hasAutoPlaced} />
  </>
);

describe('AutoPlacedGuide', () => {
  beforeEach(() => {
    localStorage.clear();
    // 선반 둘러보기를 본 상태 (둘러보기가 먼저)
    localStorage.setItem('greenbox_guide_shelf_tour_seen_u1', '1');
  });
  afterEach(cleanup);

  it('점선 카드를 비추고, 직접 누르면 그 식재료 상세를 열며 한 번만 보인다', async () => {
    const onOpen = vi.fn();
    const { unmount } = render(<List onOpen={onOpen} />);
    const guide = await screen.findByRole('dialog', {
      name: '점선은 앱이 놓은 자리예요\n눌러서 자리를 정해요',
    });
    expect(guide).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: '앱이 놓은 식재료 열기' }),
    );
    expect(onOpen).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();

    render(<List onOpen={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('선반 둘러보기를 아직 안 봤거나 앱이 놓은 식재료가 없으면 띄우지 않는다', () => {
    render(<List onOpen={vi.fn()} hasAutoPlaced={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();
    localStorage.removeItem('greenbox_guide_shelf_tour_seen_u1');
    render(<List onOpen={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
