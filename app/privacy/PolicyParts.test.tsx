// app/privacy/PolicyParts.test.ts

import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  isChangedSince,
  keepLastWord,
  plainCell,
  renderCell,
  splitLead,
} from './PolicyParts';

describe('splitLead', () => {
  it('괄호 설명을 이름과 나눠 다음 줄에 둘 수 있게 한다', () => {
    expect(splitLead('필수 (구글 로그인)')).toEqual({
      main: '필수',
      sub: '구글 로그인',
    });
    expect(splitLead('Anthropic PBC (미국)')).toEqual({
      main: 'Anthropic PBC',
      sub: '미국',
    });
  });

  it('괄호가 없으면 그대로 둔다', () => {
    expect(splitLead('자동 수집')).toEqual({ main: '자동 수집', sub: null });
  });

  it('끝의 한 글자 단어는 앞 단어와 붙인다', () => {
    expect(keepLastWord('호칭 등록 시')).toBe('호칭 등록\u00a0시');
    expect(keepLastWord('가족 내 호칭')).toBe('가족 내 호칭');
  });
});

describe('isChangedSince', () => {
  it('마지막으로 동의한 버전보다 뒤에 들어온 문장만 바뀐 것으로 본다', () => {
    expect(isChangedSince('2026-11-05', '2026-10-02')).toBe(true);
    expect(isChangedSince('2026-11-05', '2026-11-05')).toBe(false);
    expect(isChangedSince(undefined, '2026-10-02')).toBe(false);
    expect(isChangedSince('2026-11-06', undefined)).toBe(false);
  });
});

describe('표 칸의 바뀐 부분 표시', () => {
  const text = (nodes: React.ReactNode[]) => renderToStaticMarkup(<>{nodes}</>);

  it('이전 방침 뒤에 바뀐 글자만 칠하고, 표시 기호는 보이지 않는다', () => {
    const value =
      '동의 기록[[2026-11-05:, 냉장고 품목]][[2026-11-06:, 보낸 의견]]';
    const html = text(renderCell(value, '2026-11-05'));
    expect(html).toContain('동의 기록, 냉장고 품목<span class="');
    expect(html).toContain('>, 보낸 의견</span>');
    expect(html).not.toContain('[[');
    expect(plainCell(value)).toBe('동의 기록, 냉장고 품목, 보낸 의견');
  });

  it('비교할 버전이 없으면 아무것도 칠하지 않는다', () => {
    expect(text(renderCell('A[[2026-11-06:B]]'))).toBe('AB');
  });
});
