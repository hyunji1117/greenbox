// app/components/common/DevServerBadge.test.tsx

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DevServerBadge from './DevServerBadge';

describe('DevServerBadge', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('로컬 개발 서버에서만 보이고 운영 빌드에서는 그리지 않는다', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<DevServerBadge />);
    expect(screen.getByText('로컬 개발 서버')).toBeTruthy();

    cleanup();
    vi.stubEnv('NODE_ENV', 'production');
    render(<DevServerBadge />);
    expect(screen.queryByText('로컬 개발 서버')).toBeNull();
  });
});
