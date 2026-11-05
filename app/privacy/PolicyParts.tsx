// app/privacy/PolicyParts.tsx
// 개인정보처리방침 버전별 본문이 함께 쓰는 조각

import React from 'react';

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

// '필수 (구글 로그인)', 'Vultr (미국)'처럼 괄호 설명이 붙은 첫 칸을 이름과 설명으로 나눈다
// 좁은 칸에서 괄호만 줄 끝에 남지 않게 설명은 다음 줄에 둔다
export function splitLead(text: string): { main: string; sub: string | null } {
  const match = /^(.+?) \((.+)\)$/.exec(text);
  return match ? { main: match[1], sub: match[2] } : { main: text, sub: null };
}

// '호칭 등록 시'처럼 끝에 한 글자 단어가 오면 앞 단어와 붙여, 그 글자만 다음 줄로 떨어지지 않게 한다
export function keepLastWord(text: string): string {
  return text.replace(/ (\S)$/, '\u00a0$1');
}

// 아주 긴 영문 단어(Analytics 등)는 칸을 넘치지 않도록 그때만 글자 단위로 나눈다
const CELL =
  'border border-gray-200 px-1 py-1.5 align-top [overflow-wrap:break-word] sm:px-2';

interface PolicyTableProps {
  headers: string[];
  // 각 줄의 첫 칸은 구분(또는 수탁자) 이름
  rows: string[][];
  // 칸 너비 비율. 긴 영문 이름이 들어가는 칸을 조금 넓혀 단어가 쪼개지지 않게 한다
  columnWidths: string[];
}

// 320px 휴대폰에서도 표 그대로 보이게, 셀 안에서는 한글 단어 단위로만 줄을 바꾼다
// 첫 칸은 이름과 괄호 설명을 두 줄로 나눠 좁은 칸에서도 괄호가 떨어지지 않게 한다
// 칸 너비를 비율로 고정해, 칸이 많아도 화면 밖으로 밀리지 않게 한다
// 360px보다 좁은 화면은 글자를 한 단계 줄여 영문 이름(Anthropic 등)이 쪼개지지 않게 한다
export function PolicyTable({ headers, rows, columnWidths }: PolicyTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left text-xs break-keep max-[359px]:text-[11px]">
        <colgroup>
          {headers.map((header, index) => (
            <col key={header} style={{ width: columnWidths[index] }} />
          ))}
        </colgroup>
        <thead className="bg-gray-50">
          <tr>
            {headers.map(header => (
              <th key={header} className={`${CELL} font-semibold`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([lead, ...rest]) => {
            const { main, sub } = splitLead(lead);
            return (
              <tr key={lead}>
                <th
                  scope="row"
                  className={`${CELL} font-semibold text-gray-800`}
                >
                  {main}
                  {sub && (
                    <span className="block font-normal text-gray-500">
                      {keepLastWord(sub)}
                    </span>
                  )}
                </th>
                {rest.map((value, index) => (
                  <td key={headers[index + 1]} className={CELL}>
                    {keepLastWord(value)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
