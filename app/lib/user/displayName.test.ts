// app/lib/user/displayName.test.ts

import { describe, expect, it } from 'vitest';
import { personLabel, withSubjectParticle } from './displayName';

describe('personLabel', () => {
  it('구성원은 이름, 나간 구성원은 표시를 붙이고, 탈퇴하면 이름 없이 표시한다', () => {
    expect(personLabel({ id: '1', name: '현지', isMember: true })).toBe('현지');
    expect(personLabel({ id: '2', name: '낭농', isMember: false })).toBe(
      '나간 구성원 낭농',
    );
    expect(personLabel({ id: null, name: null, isMember: false })).toBe(
      '탈퇴한 구성원',
    );
  });
});

describe('withSubjectParticle', () => {
  it('받침에 따라 이/가를 고른다', () => {
    expect(withSubjectParticle('엄마')).toBe('엄마가');
    expect(withSubjectParticle('현진')).toBe('현진이');
    expect(withSubjectParticle('Eve')).toBe('Eve가');
  });
});
