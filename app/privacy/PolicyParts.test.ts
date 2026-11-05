// app/privacy/PolicyParts.test.ts

import { describe, expect, it } from 'vitest';
import { keepLastWord, splitLead } from './PolicyParts';

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
