// app/lib/storage/ShoppingListStorage.ts
// 장바구니 및 즐겨찾기 데이터를 localStorage에 저장하는 클래스

interface ShoppingListItem {
  id: number;
  name: string;
  quantity: number;
  completed: boolean;
}

interface FavoriteItem {
  id: number;
  name: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
}
class ShoppingListStorage {
  private readonly SHOPPING_LIST_KEY = 'fridgeBoard_shoppingList';
  private readonly FAVORITES_KEY = 'fridgeBoard_favorites';

  // 장바구니 리스트 저장
  saveShoppingList(shoppingList: ShoppingListItem[]): void {
    try {
      localStorage.setItem(
        this.SHOPPING_LIST_KEY,
        JSON.stringify(shoppingList),
      );
    } catch (error) {
      console.error('Failed to save shopping list:', error);
    }
  }

  // 장바구니 리스트 불러오기
  loadShoppingList(): ShoppingListItem[] {
    try {
      const stored = localStorage.getItem(this.SHOPPING_LIST_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load shopping list:', error);
    }
    return [];
  }

  // 즐겨찾기 저장
  saveFavorites(favorites: FavoriteItem[]): void {
    try {
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }

  // 즐겨찾기 불러오기
  loadFavorites(): FavoriteItem[] {
    try {
      const stored = localStorage.getItem(this.FAVORITES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
    return [];
  }

  // 모든 데이터 삭제
  clearAll(): void {
    try {
      localStorage.removeItem(this.SHOPPING_LIST_KEY);
      localStorage.removeItem(this.FAVORITES_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

// ShoppingListStorage 클래스의 인스턴스를 생성
const shoppingListStorageInstance = new ShoppingListStorage();

export default shoppingListStorageInstance;
