// app/lib/api/apiFetch.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, ApiSchemaError, apiFetch } from './apiFetch';
import { APP_VERSION } from '@/app/lib/app/version';

const Schema = z.object({ id: z.string() });

const mockFetch = (status: number, body: string) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(body, { status })),
  );

afterEach(() => vi.unstubAllGlobals());

describe('apiFetch', () => {
  it('응답이 스키마와 맞으면 파싱한 값을 돌려준다', async () => {
    mockFetch(200, '{"id":"1"}');

    await expect(apiFetch('/api/x', Schema)).resolves.toEqual({ id: '1' });
  });

  it('응답 형식이 다르면 ApiSchemaError를 던진다', async () => {
    mockFetch(200, '{"id":1}');

    const error = await apiFetch('/api/x', Schema).catch(e => e);

    expect(error).toBeInstanceOf(ApiSchemaError);
    expect(error.issues[0].path).toEqual(['id']);
  });

  it('실패 상태면 상태 코드와 본문을 담은 ApiError를 던진다', async () => {
    mockFetch(401, '{"error":"unauthorized"}');

    const error = await apiFetch('/api/x', Schema).catch(e => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.body).toEqual({ error: 'unauthorized' });
  });

  it('body가 있으면 JSON으로 보낸다', async () => {
    mockFetch(201, '{"id":"1"}');

    await apiFetch('/api/x', Schema, { method: 'POST', body: { a: 1 } });

    expect(fetch).toHaveBeenCalledWith(
      '/api/x',
      expect.objectContaining({
        method: 'POST',
        body: '{"a":1}',
        headers: {
          'x-app-version': APP_VERSION,
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('예전 버전이라 업데이트가 필요하다는 426이면 업데이트 화면을 띄우게 알린다', async () => {
    mockFetch(426, '{"error":"update_required"}');
    const onUpdate = vi.fn();
    window.addEventListener('greenbox:update-required', onUpdate);

    await expect(apiFetch('/api/x', Schema)).rejects.toBeInstanceOf(ApiError);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    window.removeEventListener('greenbox:update-required', onUpdate);
  });

  it('방침 동의가 필요하다는 403이면 동의 화면으로 보낸다', async () => {
    mockFetch(403, '{"error":"consent_required"}');
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    const error = await apiFetch('/api/x', Schema).catch(e => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(assign).toHaveBeenCalledWith('/consent');
  });

  it('다른 이유의 403이면 이동하지 않는다', async () => {
    mockFetch(403, '{"error":"forbidden"}');
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    await apiFetch('/api/x', Schema).catch(() => null);

    expect(assign).not.toHaveBeenCalled();
  });
});
