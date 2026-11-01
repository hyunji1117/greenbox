// app/components/settings/PushNotificationCard.test.tsx

import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PushNotificationCard from './PushNotificationCard';

const mocks = vi.hoisted(() => ({
  getPushStatus: vi.fn(),
  enablePush: vi.fn(),
}));

vi.mock('@/app/lib/push/subscribe', () => ({
  getPushStatus: mocks.getPushStatus,
  enablePush: mocks.enablePush,
}));

const button = () => screen.queryByRole('button', { name: '알림 켜기' });

describe('PushNotificationCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(cleanup);

  it('아직 묻지 않은 기기는 누르면 켜고 버튼을 없앤다', async () => {
    mocks.getPushStatus.mockReturnValue('default');
    mocks.enablePush.mockResolvedValue('granted');
    render(<PushNotificationCard />);

    fireEvent.click(button()!);

    await waitFor(() => expect(button()).toBeNull());
    expect(screen.getByText(/매일 아침 알려 드려요/)).toBeTruthy();
  });

  it('켜기에 실패하면 버튼을 남기고 안내한다', async () => {
    mocks.getPushStatus.mockReturnValue('default');
    mocks.enablePush.mockRejectedValue(new Error('x'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PushNotificationCard />);

    fireEvent.click(button()!);

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(button()).toBeTruthy();
  });

  it.each([
    ['denied', /기기 설정/],
    ['unsupported', /홈 화면에 추가/],
  ])('%s 상태는 버튼 없이 안내만 보여 준다', (status, text) => {
    mocks.getPushStatus.mockReturnValue(status);
    render(<PushNotificationCard />);

    expect(button()).toBeNull();
    expect(screen.getByText(text)).toBeTruthy();
  });
});
