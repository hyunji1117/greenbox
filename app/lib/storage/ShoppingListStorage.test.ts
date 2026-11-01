// app/lib/storage/ShoppingListStorage.test.ts

import { beforeEach, describe, expect, it } from 'vitest';
import shoppingListStorage from './ShoppingListStorage';

describe('addToShoppingList', () => {
  beforeEach(() => {
    shoppingListStorage.clearAll();
  });

  it('없는 품목은 새로 담고 있는 품목은 수량만 늘린다', () => {
    shoppingListStorage.addToShoppingList('우유');
    shoppingListStorage.addToShoppingList('우유');

    expect(shoppingListStorage.loadShoppingList()).toMatchObject([
      { name: '우유', quantity: 2, completed: false },
    ]);
  });
});
