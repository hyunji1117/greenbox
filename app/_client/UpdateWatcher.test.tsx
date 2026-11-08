// app/_client/UpdateWatcher.test.tsx

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

  it('이미 그 버전으로 새로 불러왔는데도 예전이면 반복하지 않고 안내만 띄운다', async () => {
    deployed('99.0.0');
    sessionStorage.setItem(RELOADED_FOR_KEY, '99.0.0');
    render(<UpdateWatcher />);
    expect(await screen.findByText('새 버전이 나왔어요')).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
  });

  it('같은 버전이면 아무것도 하지 않는다', async () => {
    deployed(APP_VERSION);
    render(<UpdateWatcher />);
    await new Promise(r => setTimeout(r, 20));
    expect(reload).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
