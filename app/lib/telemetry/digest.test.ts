// @vitest-environment node
// app/lib/telemetry/digest.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deleteExpiredTelemetry: vi.fn(),
  hasOpsDigestSent: vi.fn(),
  recordOpsDigestSent: vi.fn(),
  summarizeErrors: vi.fn(),
  summarizeVitals: vi.fn(),
  summarizePushVariants: vi.fn(),
}));
vi.mock('@/app/lib/telemetry/store', () => ({
  deleteExpiredTelemetry: mocks.deleteExpiredTelemetry,
  hasOpsDigestSent: mocks.hasOpsDigestSent,
  recordOpsDigestSent: mocks.recordOpsDigestSent,
  summarizeErrors: mocks.summarizeErrors,
  summarizeVitals: mocks.summarizeVitals,
}));
vi.mock('@/app/lib/notifications/store', () => ({
  summarizePushVariants: mocks.summarizePushVariants,
}));

import { buildOpsDigestHtml, runOpsDigest } from './digest';

// 2026-11-09(월) 09:10 KST
const NINE_AM = new Date('2026-11-09T00:10:00Z');

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hasOpsDigestSent.mockResolvedValue(false);
  mocks.recordOpsDigestSent.mockResolvedValue(true);
  mocks.deleteExpiredTelemetry.mockResolvedValue(0);
  mocks.summarizeVitals.mockResolvedValue([
    { metric: 'LCP', device: 'mobile', count: 12, p75: 2294, poorShare: 0 },
  ]);
  mocks.summarizeErrors.mockResolvedValue([
    {
      kind: 'error',
      message: 'boom <b>',
      page: 'fridge',
      count: 3,
      appVersion: '1.6.0',
      lastStack: null,
    },
  ]);
  mocks.summarizePushVariants.mockResolvedValue([
    { kind: 'daily', variant: 'A', sent: 10, opened: 3 },
  ]);
});

describe('runOpsDigest', () => {
  it('오전 9시대에 하루 한 번 성능, 오류, 문구별 열기 비율을 보낸다', async () => {
    const send = vi.fn();
    const result = await runOpsDigest(NINE_AM, send);

    expect(result).toEqual({
      status: 'sent',
      vitals: 12,
      errors: 3,
      deleted: 0,
    });
    const email = send.mock.calls[0][0];
    expect(email.subject).toContain('오류 3건');
    expect(email.html).toContain('2,294ms');
    expect(email.html).toContain('30%');
    // 오류 메시지는 그대로 넣지 않고 글자로 바꾼다
    expect(email.html).toContain('boom &lt;b&gt;');
  });

  it('9시대가 아니거나 이미 보냈으면 보내지 않는다', async () => {
    const send = vi.fn();
    expect(
      (await runOpsDigest(new Date('2026-11-09T05:00:00Z'), send)).status,
    ).toBe('not_due');
    mocks.hasOpsDigestSent.mockResolvedValue(true);
    expect((await runOpsDigest(NINE_AM, send)).status).toBe('already_sent');
    expect(send).not.toHaveBeenCalled();
  });

  it('모인 것이 없으면 보내지 않는다', async () => {
    mocks.summarizeVitals.mockResolvedValue([]);
    mocks.summarizeErrors.mockResolvedValue([]);
    mocks.summarizePushVariants.mockResolvedValue([]);
    const send = vi.fn();
    expect((await runOpsDigest(NINE_AM, send)).status).toBe('no_data');
    expect(send).not.toHaveBeenCalled();
  });
});

describe('buildOpsDigestHtml', () => {
  it('좋음 기준을 넘은 p75는 붉게 표시한다', () => {
    const html = buildOpsDigestHtml({
      vitals: [
        {
          metric: 'LCP',
          device: 'mobile',
          count: 5,
          p75: 4024,
          poorShare: 0.4,
        },
      ],
      errors: [],
      variantsWeek: [],
      variantsAll: [],
    });
    expect(html).toContain('#B4442E');
    expect(html).toContain('화면 오류가 없어요');
  });
});
