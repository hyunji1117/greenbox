// app/lib/items/nameMatch.test.ts

import { describe, expect, it } from 'vitest';
import { findByName, matchScore, nameVariants } from './nameMatch';

const items = [
  { name: '계란' },
  { name: '방울토마토' },
  { name: '쇠고기 국거리' },
  { name: '파프리카' },
  { name: '양파' },
];

describe('nameMatch', () => {
  it('같은 재료의 다른 이름으로 말해도 찾는다', () => {
    expect(findByName(items, '달걀').map(i => i.name)).toEqual(['계란']);
    expect(findByName(items, '소고기').map(i => i.name)).toEqual([
      '쇠고기 국거리',
    ]);
    expect(nameVariants('달걀말이')).toContain('계란말이');
  });

  it('띄어쓰기, 문장 부호, 한 글자 틀린 인식도 찾는다', () => {
    expect(findByName(items, '방울 토마토.').map(i => i.name)).toEqual([
      '방울토마토',
    ]);
    // 음성 인식이 한 글자 틀림 (세 글자 이상만)
    expect(matchScore('파프리카', '파프리가')).toBe(3);
    expect(matchScore('양파', '양배')).toBeNull();
  });

  it('이름이 같은 것을 먼저 주고, 다른 재료 이름 안의 글자로는 찾지 않는다', () => {
    const list = [{ name: '닭가슴살' }, { name: '닭고기' }, { name: '양파' }];
    expect(findByName(list, '닭고기').map(i => i.name)).toEqual([
      '닭고기',
      '닭가슴살',
    ]);
    expect(findByName(list, '대파')).toEqual([]);
  });
});
