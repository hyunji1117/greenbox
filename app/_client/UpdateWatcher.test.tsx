// app/_client/UpdateWatcher.test.tsx

import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_VERSION } from '@/app/lib/app/version';
import { RELOADED_FOR_KEY } from '@/app/lib/app/updateCheck';
import UpdateWatcher from './UpdateWatcher';

const reload = vi.fn();
const deployed = (version: string) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ version }))),
  );

beforeEach(() => {
  reload.mockReset();
  sessionStorage.clear();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('UpdateWatcher', () => {
  it('앱을 열었을 때 새 버전이 배포돼 있으면 바로 새로 불러온다', async () => {
    deployed('99.0.0');
    render(<UpdateWatcher />);
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(sessionStorage.getItem(RELOADED_FOR_KEY)).toBe('99.0.0');
  });

  it('이미 새로 받았는데도 예전이면 반복하지 않고, 화면을 덮어 앱을 다시 열도록 안내한다', async () => {
    deployed('99.0.0');
    sessionStorage.setItem(RELOADED_FOR_KEY, '99.0.0');
    render(<UpdateWatcher />);
    // 닫을 수 없는 창으로 화면을 덮어 예전 버전으로는 쓰지 못하게 한다
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog.textContent).toContain(
      '앱을 완전히 닫았다가 다시 열어 주세요',
    );
    expect(screen.queryByRole('button', { name: /닫기/ })).toBeNull();
    expect(reload).not.toHaveBeenCalled();

    // 다시 시도하면 캐시를 지우고 새로 받아 다시 연다
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('같은 버전이면 아무것도 하지 않는다', async () => {
    deployed(APP_VERSION);
    render(<UpdateWatcher />);
    await new Promise(r => setTimeout(r, 20));
    expect(reload).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
