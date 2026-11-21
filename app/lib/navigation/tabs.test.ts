import { describe, expect, it, vi } from 'vitest';
import { announceTabReselect, onTabReselect } from './tabs';

describe('탭 다시 누르기', () => {
  it('그 탭을 다시 눌렀을 때만 알리고, 그만 들으면 더 알리지 않는다', () => {
    const onFridge = vi.fn();
    const stop = onTabReselect('fridge', onFridge);
    announceTabReselect('stats');
    expect(onFridge).not.toHaveBeenCalled();
    announceTabReselect('fridge');
    expect(onFridge).toHaveBeenCalledTimes(1);
    stop();
    announceTabReselect('fridge');
    expect(onFridge).toHaveBeenCalledTimes(1);
  });
});
