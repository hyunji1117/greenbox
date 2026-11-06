// @vitest-environment node
// app/lib/feedback/digest.test.ts

import ExcelJS from 'exceljs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedbackRow } from './store';
import {
  buildDigestHtml,
  buildFeedbackWorkbook,
  koreaTimeLabel,
  runFeedbackDigest,
} from './digest';

const mocks = vi.hoisted(() => ({
  deleteExpiredFeedback: vi.fn(),
  hasDigestSent: vi.fn(),
  lastDigestSentAt: vi.fn(),
  listAllFeedback: vi.fn(),
  recordDigestSent: vi.fn(),
}));
vi.mock('./store', () => mocks);

const row = (id: string, iso: string, text = `의견 ${id}`): FeedbackRow => ({
  id,
  userId: '7',
  text,
  inputMethod: 'text',
  page: 'fridge',
  createdAt: new Date(iso),
});

// 2026-11-06 09:05 KST
const NINE_AM = new Date('2026-11-06T00:05:00Z');

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hasDigestSent.mockResolvedValue(false);
  mocks.deleteExpiredFeedback.mockResolvedValue(0);
  mocks.recordDigestSent.mockResolvedValue(true);
});

describe('buildFeedbackWorkbook', () => {
  it('전체 의견을 오래된 것부터 한국 시간으로 담는다', async () => {
    const buffer = await buildFeedbackWorkbook([
      row('1', '2026-11-05T23:15:00Z', '알림이 <늦어요>'),
      row('2', '2026-11-06T00:01:00Z'),
    ]);
    const workbook = new ExcelJS.Workbook();
    // exceljs 타입이 Node Buffer 최신 타입과 맞지 않아 형만 맞춘다
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('의견')!;
    expect(sheet.getRow(1).values).toEqual([
      undefined,
      '번호',
      '받은 시각(한국)',
      '입력 방식',
      '화면',
      '내용',
      '회원 번호',
    ]);
    expect(sheet.getRow(2).values).toEqual([
      undefined,
      1,
      '2026-11-06 08:15',
      '글자',
      '냉장고',
      '알림이 <늦어요>',
      7,
    ]);
    expect(sheet.rowCount).toBe(3);
  });
});

describe('buildDigestHtml', () => {
  it('새 의견만 보여 주고 내용의 HTML은 글자로 바꾼다', () => {
    const html = buildDigestHtml(
      [row('2', '2026-11-06T00:01:00Z', '<b>굵게</b>')],
      5,
    );
    expect(html).toContain('새 의견 1건');
    expect(html).toContain('의견 5건');
    expect(html).toContain('&lt;b&gt;굵게&lt;/b&gt;');
    expect(html).not.toContain('<b>');
  });
});

describe('runFeedbackDigest', () => {
  it('오전 9시대가 아니면 아무것도 하지 않는다', async () => {
    const send = vi.fn();
    const result = await runFeedbackDigest(
      new Date('2026-11-06T03:00:00Z'),
      send,
    );
    expect(result).toEqual({ status: 'not_due', koreaHour: 12 });
    expect(mocks.listAllFeedback).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('오늘 이미 보냈으면 다시 보내지 않는다', async () => {
    mocks.hasDigestSent.mockResolvedValue(true);
    const send = vi.fn();
    expect((await runFeedbackDigest(NINE_AM, send)).status).toBe(
      'already_sent',
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('지난 메일 이후 새 의견이 없으면 보내지도 기록하지도 않는다', async () => {
    mocks.listAllFeedback.mockResolvedValue([row('1', '2026-11-04T00:00:00Z')]);
    mocks.lastDigestSentAt.mockResolvedValue(new Date('2026-11-05T00:05:00Z'));
    const send = vi.fn();

    expect(await runFeedbackDigest(NINE_AM, send)).toEqual({
      status: 'no_new',
      total: 1,
      deleted: 0,
    });
    expect(send).not.toHaveBeenCalled();
    expect(mocks.recordDigestSent).not.toHaveBeenCalled();
  });

  it('새 의견이 있으면 전체 엑셀을 첨부해 보내고 기록한다', async () => {
    mocks.listAllFeedback.mockResolvedValue([
      row('1', '2026-11-04T00:00:00Z'),
      row('2', '2026-11-05T12:00:00Z'),
    ]);
    mocks.lastDigestSentAt.mockResolvedValue(new Date('2026-11-05T00:05:00Z'));
    mocks.deleteExpiredFeedback.mockResolvedValue(3);
    const send = vi.fn().mockResolvedValue(undefined);

    const result = await runFeedbackDigest(NINE_AM, send);

    expect(result).toEqual({
      status: 'sent',
      newCount: 1,
      total: 2,
      deleted: 3,
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('새 의견 1건 (2026-11-06)'),
        filename: 'greenbox_의견_2026-11-06.xlsx',
      }),
    );
    expect(mocks.recordDigestSent).toHaveBeenCalledWith('2026-11-06', 1, 2);
  });

  it('메일 발송이 실패하면 기록하지 않아 다음 실행에서 다시 보낸다', async () => {
    mocks.listAllFeedback.mockResolvedValue([row('1', '2026-11-05T12:00:00Z')]);
    mocks.lastDigestSentAt.mockResolvedValue(null);
    const send = vi.fn().mockRejectedValue(new Error('메일 발송 실패: 500'));

    await expect(runFeedbackDigest(NINE_AM, send)).rejects.toThrow(/500/);
    expect(mocks.recordDigestSent).not.toHaveBeenCalled();
  });
});

describe('koreaTimeLabel', () => {
  it('한국 시간으로 표시한다', () => {
    expect(koreaTimeLabel(new Date('2026-11-05T15:30:00Z'))).toBe(
      '2026-11-06 00:30',
    );
  });
});
