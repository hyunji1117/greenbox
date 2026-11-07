// app/lib/feedback/digest.ts
// 매일 아침 한 번, 남아 있는 의견 전체를 엑셀로 만들어 운영자 메일로 보낸다
// 엑셀은 매일 DB 전체로 새로 만들어서 따로 파일을 이어 붙이지 않아도 누적된다
// 새 의견이 없는 날은 보내지 않는다. 다음에 보낼 때 지난 메일 이후의 의견을 모두 본문에 담는다

import ExcelJS from 'exceljs';
import { APP_NAME } from '@/app/lib/brand';
import { OPERATOR } from '@/app/lib/consent/operator';
import {
  deleteExpiredFeedback,
  hasDigestSent,
  lastDigestSentAt,
  listAllFeedback,
  recordDigestSent,
  type FeedbackRow,
} from '@/app/lib/feedback/store';
import { isDueHour, koreaClock } from '@/app/lib/notifications/schedule';

// 한국 시간 오전 9시 (예약 실행이 늦어도 2시간 안에는 보낸다)
export const DIGEST_HOUR = 9;

const METHOD_LABEL = { text: '글자', voice: '음성' } as const;

const PAGE_LABEL: Record<string, string> = {
  home: '홈',
  fridge: '냉장고',
  shoppingList: '리스트',
  stats: '통계',
  settings: '마이',
};

// 한국 시간 "2026-11-06 08:15"
export function koreaTimeLabel(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16).replace('T', ' ');
}

const pageLabel = (page: string | null) =>
  page ? (PAGE_LABEL[page] ?? page) : '';

export async function buildFeedbackWorkbook(
  rows: FeedbackRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date(0);
  const sheet = workbook.addWorksheet('의견', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: '번호', key: 'id', width: 8 },
    { header: '받은 시각(한국)', key: 'createdAt', width: 18 },
    { header: '입력 방식', key: 'method', width: 10 },
    { header: '화면', key: 'page', width: 10 },
    { header: '내용', key: 'text', width: 70 },
    { header: '회원 번호', key: 'userId', width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow({
      id: Number(row.id),
      createdAt: koreaTimeLabel(row.createdAt),
      method: METHOD_LABEL[row.inputMethod],
      page: pageLabel(row.page),
      text: row.text,
      userId: Number(row.userId),
    });
  }
  sheet.getColumn('text').alignment = { wrapText: true, vertical: 'top' };
  sheet.autoFilter = { from: 'A1', to: 'F1' };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// 본문에는 새 의견만 보여 준다 (전체는 첨부 엑셀)
export function buildDigestHtml(newRows: FeedbackRow[], total: number): string {
  const items = newRows
    .map(
      row => `<li style="margin-bottom:12px">
  <div style="color:#666;font-size:12px">${koreaTimeLabel(row.createdAt)} / ${METHOD_LABEL[row.inputMethod]}${row.page ? ` / ${escapeHtml(pageLabel(row.page))}` : ''}</div>
  <div style="white-space:pre-wrap">${escapeHtml(row.text)}</div>
</li>`,
    )
    .join('\n');
  return `<p>새 의견 ${newRows.length}건이 들어왔어요. 지금까지 쌓인 의견 ${total}건은 첨부한 엑셀에 있어요.</p>
<ol>${items}</ol>`;
}

export interface DigestEmail {
  subject: string;
  html: string;
  filename: string;
  attachment: Buffer;
}

// Resend로 보낸다. 가입한 본인 메일로는 도메인 없이 onboarding@resend.dev에서 보낼 수 있다
export async function sendDigestEmail(email: DigestEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY가 없습니다');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:
        process.env.FEEDBACK_EMAIL_FROM ??
        `${APP_NAME} <onboarding@resend.dev>`,
      to: [process.env.FEEDBACK_EMAIL_TO ?? OPERATOR.email],
      subject: email.subject,
      html: email.html,
      attachments: [
        {
          filename: email.filename,
          content: email.attachment.toString('base64'),
        },
      ],
    }),
  });
  if (!res.ok) {
    // 응답 본문에 메일 주소가 섞일 수 있어 상태만 남긴다
    throw new Error(`메일 발송 실패: ${res.status}`);
  }
}

export type DigestResult =
  | { status: 'not_due' | 'already_sent'; koreaHour: number }
  | { status: 'no_new'; total: number; deleted: number }
  | { status: 'sent'; newCount: number; total: number; deleted: number };

export interface DigestOptions {
  // 운영자가 수동 실행에서 고르면 오전 9시대가 아니어도 지금 보낸다
  // 하루 한 번 기록은 그대로 남겨, 같은 날 두 번 보내지 않고 다음 날 오전 발송은 평소대로 간다
  sendNow?: boolean;
}

export async function runFeedbackDigest(
  now: Date = new Date(),
  send: (email: DigestEmail) => Promise<void> = sendDigestEmail,
  { sendNow = false }: DigestOptions = {},
): Promise<DigestResult> {
  const clock = koreaClock(now);
  if (!sendNow && !isDueHour(DIGEST_HOUR, clock.hour)) {
    return { status: 'not_due', koreaHour: clock.hour };
  }
  if (await hasDigestSent(clock.date)) {
    return { status: 'already_sent', koreaHour: clock.hour };
  }

  const deleted = await deleteExpiredFeedback();
  const all = await listAllFeedback();
  const since = await lastDigestSentAt();
  const newRows = since ? all.filter(row => row.createdAt > since) : all;
  if (newRows.length === 0) {
    return { status: 'no_new', total: all.length, deleted };
  }

  await send({
    subject: `[${APP_NAME}] 새 의견 ${newRows.length}건 (${clock.date})`,
    html: buildDigestHtml(newRows, all.length),
    filename: `greenbox_의견_${clock.date}.xlsx`,
    attachment: await buildFeedbackWorkbook(all),
  });
  await recordDigestSent(clock.date, newRows.length, all.length);
  return {
    status: 'sent',
    newCount: newRows.length,
    total: all.length,
    deleted,
  };
}
