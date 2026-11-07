// app/components/ingredients/RecipeCard.test.ts

import { describe, expect, it } from 'vitest';
import { withDirectionParticle } from './RecipeCard';

describe('withDirectionParticle', () => {
  it('받침에 따라 로와 으로를 고른다', () => {
    expect(withDirectionParticle('두부, 시금치')).toBe('두부, 시금치로');
    expect(withDirectionParticle('연근')).toBe('연근으로');
    expect(withDirectionParticle('닭가슴살')).toBe('닭가슴살로');
  });
});
