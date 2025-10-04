// app/lib/storage/PurchaseDataStorage.ts
// IndexedDB를 사용한 구매 데이터 저장 및 관리 모듈

// ==========================================
//                인터페이스 정의
// ==========================================

/**
 * 구매 이력 인터페이스
 * 각 아이템의 전체 구매 기록을 관리
 */
export interface PurchaseHistory {
  itemName: string; // 아이템 이름 (Primary Key)
  purchaseCount: number; // 총 구매 횟수
  lastPurchaseDate: Date; // 마지막 구매 날짜
  firstPurchaseDate: Date; // 첫 구매 날짜
  purchases: Array<{
    // 구매 상세 기록 배열
    date: Date; // 구매 날짜
    quantity: number; // 구매 수량
  }>;
}

/**
 * 인기 아이템 인터페이스
 * 구매 횟수 기반 상위 아이템 정보
 */
export interface TopItem {
  itemName: string; // 아이템 이름
  purchaseCount: number; // 총 구매 횟수
}

/**
 * 구매 아이템 인터페이스
 * 개별 구매 아이템의 상세 정보
 */
export interface PurchaseItem {
  itemName: string; // 아이템 이름 (필수)
  category?: string; // 카테고리 (선택: 과일, 채소, 육류 등)
  price?: number; // 가격 (선택)
  quantity?: number; // 구매 수량 (선택)
}

/**
 * 구매 데이터 인터페이스
 * 전체 구매 트랜잭션 정보
 */
export interface PurchaseData {
  id: string; // 고유 구매 ID
  purchaseDate: string; // 구매 날짜 (ISO 문자열)
  items: PurchaseItem[]; // 구매 아이템 목록
  totalAmount?: number; // 총 구매 금액 (선택)
}

/**
 * 완료된 구매 인터페이스
 * 구매 완료 기록 저장용
 */
export interface CompletedPurchase {
  id?: number; // 자동 생성 ID (auto increment)
  items: Array<{
    // 구매한 아이템 목록
    name: string; // 아이템 이름
    quantity: number; // 구매 수량
  }>;
  completedAt: Date; // 구매 완료 시간
  totalItems: number; // 총 아이템 개수
}

// ==========================================
//         메인 클래스: IndexedDB 작업 관리
// ==========================================

/**
 * PurchaseDataStorage 클래스
 * IndexedDB를 사용한 구매 데이터 영구 저장소 관리
 * 싱글톤 패턴으로 구현
 */
class PurchaseDataStorage {
  // ==========================================
  //              클래스 속성
  // ==========================================

  private DB_NAME = 'OurFridgePurchaseDB'; // 데이터베이스 이름
  private DB_VERSION = 1; // 데이터베이스 버전 (스키마 변경 시 증가)
  private db: IDBDatabase | null = null; // 데이터베이스 인스턴스

  // ==========================================
  //          데이터베이스 초기화 메서드
  // ==========================================

  /**
   * 데이터베이스 초기화
   * IndexedDB를 열고 필요한 객체 스토어를 생성
   * @returns Promise<void>
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // IndexedDB 열기 요청
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      // 에러 처리 - DB 열기 실패
      request.onerror = () => reject(request.error);

      // 성공 처리 - DB 열기 성공
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Purchase DB initialized');
        resolve();
      };

      // 업그레이드 필요시 (첫 생성 또는 버전 변경)
      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // ==========================================
        //     purchaseHistory 객체 스토어 생성
        // ==========================================
        if (!db.objectStoreNames.contains('purchaseHistory')) {
          // 아이템별 구매 이력 스토어
          const store = db.createObjectStore('purchaseHistory', {
            keyPath: 'itemName', // 아이템 이름을 Primary Key로 사용
          });

          // 구매 횟수 인덱스 (정렬 및 검색용)
          store.createIndex('purchaseCount', 'purchaseCount', {
            unique: false, // 중복 허용
          });

          // 마지막 구매일 인덱스 (날짜별 검색용)
          store.createIndex('lastPurchaseDate', 'lastPurchaseDate', {
            unique: false, // 중복 허용
          });
        }

        // ==========================================
        //   completedPurchases 객체 스토어 생성
        // ==========================================
        if (!db.objectStoreNames.contains('completedPurchases')) {
          // 완료된 구매 트랜잭션 스토어
          const store = db.createObjectStore('completedPurchases', {
            keyPath: 'id',
            autoIncrement: true, // ID 자동 증가
          });

          // 구매 완료 시간 인덱스 (날짜 범위 검색용)
          store.createIndex('completedAt', 'completedAt', {
            unique: false, // 중복 허용
          });
        }
      };
    });
  }

  // ==========================================
  //            구매 기록 관련 메서드
  // ==========================================

  /**
   * 구매 기록 저장
   * 여러 아이템의 구매를 한 번에 기록
   * @param items - 구매한 아이템 배열
   * @returns Promise<void>
   */
  async recordPurchase(
    items: Array<{ name: string; quantity: number }>,
  ): Promise<void> {
    // DB 초기화 확인
    if (!this.db) await this.init();

    // 트랜잭션 시작 (두 스토어 동시 업데이트)
    const transaction = this.db!.transaction(
      ['purchaseHistory', 'completedPurchases'],
      'readwrite', // 읽기/쓰기 권한
    );

    // ==========================================
    //      각 아이템별 구매 이력 업데이트
    // ==========================================
    for (const item of items) {
      const historyStore = transaction.objectStore('purchaseHistory');

      try {
        // 기존 구매 기록 조회
        const existingRecord = await this.getRecord<PurchaseHistory>(
          historyStore,
          item.name,
        );

        if (existingRecord) {
          // ==========================================
          //        기존 기록이 있는 경우: 업데이트
          // ==========================================
          existingRecord.purchaseCount += 1; // 구매 횟수 증가
          existingRecord.lastPurchaseDate = new Date(); // 마지막 구매일 갱신

          // 새 구매 내역 추가
          existingRecord.purchases.push({
            date: new Date(),
            quantity: item.quantity,
          });

          // 업데이트된 레코드 저장
          await this.putRecord(historyStore, existingRecord);
        } else {
          // ==========================================
          //        신규 아이템: 새 기록 생성
          // ==========================================
          const newRecord: PurchaseHistory = {
            itemName: item.name,
            purchaseCount: 1, // 첫 구매
            firstPurchaseDate: new Date(),
            lastPurchaseDate: new Date(),
            purchases: [
              {
                date: new Date(),
                quantity: item.quantity,
              },
            ],
          };

          // 새 레코드 추가
          await this.addRecord(historyStore, newRecord);
        }
      } catch (error) {
        // 개별 아이템 실패 시 로깅 (전체 트랜잭션은 계속 진행)
        console.error(`Failed to record purchase for ${item.name}:`, error);
      }
    }

    // ==========================================
    //        완료된 구매 트랜잭션 저장
    // ==========================================
    const completedStore = transaction.objectStore('completedPurchases');
    await this.addRecord(completedStore, {
      items,
      completedAt: new Date(),
      totalItems: items.length,
    });
  }

  // ==========================================
  //            조회 관련 메서드
  // ==========================================

  /**
   * 특정 아이템의 구매 횟수 조회
   * @param itemName - 조회할 아이템 이름
   * @returns 구매 횟수 (없으면 0)
   */
  async getPurchaseCount(itemName: string): Promise<number> {
    // DB 초기화 확인
    if (!this.db) await this.init();

    // 읽기 전용 트랜잭션
    const transaction = this.db!.transaction(['purchaseHistory'], 'readonly');
    const store = transaction.objectStore('purchaseHistory');

    // 레코드 조회
    const record = await this.getRecord<PurchaseHistory>(store, itemName);
    return record?.purchaseCount || 0; // 없으면 0 반환
  }

  /**
   * 가장 많이 구매한 아이템 목록 조회
   * @param limit - 조회할 아이템 개수 (기본값: 10)
   * @returns 상위 구매 아이템 목록 (내림차순)
   */
  async getTopPurchasedItems(limit: number = 10): Promise<PurchaseHistory[]> {
    // DB 초기화 확인
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['purchaseHistory'], 'readonly');
    const store = transaction.objectStore('purchaseHistory');
    const index = store.index('purchaseCount'); // 구매 횟수 인덱스 사용

    // 모든 기록 조회 후 정렬
    const allRecords = await this.getAllRecords<PurchaseHistory>(index);

    // 구매 횟수 기준 내림차순 정렬 후 상위 N개 반환
    return allRecords
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, limit);
  }

  /**
   * 전체 구매 이력 조회
   * @returns 모든 아이템의 구매 이력
   */
  async getAllPurchaseHistory(): Promise<PurchaseHistory[]> {
    // DB 초기화 확인
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['purchaseHistory'], 'readonly');
    const store = transaction.objectStore('purchaseHistory');

    // 모든 레코드 반환
    return this.getAllRecords<PurchaseHistory>(store);
  }

  /**
   * 완료된 구매 목록 조회
   * @returns 모든 완료된 구매 트랜잭션
   */
  async getCompletedPurchases(): Promise<CompletedPurchase[]> {
    // DB 초기화 확인
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(
      ['completedPurchases'],
      'readonly',
    );
    const store = transaction.objectStore('completedPurchases');

    // 모든 완료된 구매 반환
    return this.getAllRecords<CompletedPurchase>(store);
  }

  /**
   * 특정 아이템의 상세 구매 이력 조회
   * @param itemName - 조회할 아이템 이름
   * @returns 구매 이력 또는 null
   */
  async getItemPurchaseHistory(
    itemName: string,
  ): Promise<PurchaseHistory | null> {
    // DB 초기화 확인
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['purchaseHistory'], 'readonly');
    const store = transaction.objectStore('purchaseHistory');

    // 특정 아이템 레코드 조회
    const record = await this.getRecord<PurchaseHistory>(store, itemName);
    return record || null;
  }

  /**
   * 날짜 범위로 완료된 구매 조회
   * @param startDate - 시작 날짜
   * @param endDate - 종료 날짜
   * @returns 해당 기간의 구매 목록
   */
  async getCompletedPurchasesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<CompletedPurchase[]> {
    // DB 초기화 확인
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(
      ['completedPurchases'],
      'readonly',
    );
    const store = transaction.objectStore('completedPurchases');

    // 모든 구매 조회
    const allPurchases = await this.getAllRecords<CompletedPurchase>(store);

    // 날짜 범위 필터링
    return allPurchases.filter(purchase => {
      const purchaseDate = new Date(purchase.completedAt);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });
  }

  // ==========================================
  //           내부 헬퍼 메서드 (Private)
  // ==========================================

  /**
   * 단일 레코드 조회 헬퍼
   * @param store - 객체 스토어
   * @param key - 조회할 키
   * @returns 레코드 또는 undefined
   */
  private getRecord<T>(
    store: IDBObjectStore,
    key: string,
  ): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 레코드 업데이트 헬퍼
   * @param store - 객체 스토어
   * @param record - 업데이트할 레코드
   */
  private putRecord<T>(store: IDBObjectStore, record: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.put(record); // put: 있으면 업데이트, 없으면 추가
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 새 레코드 추가 헬퍼
   * @param store - 객체 스토어
   * @param record - 추가할 레코드
   */
  private addRecord<T>(store: IDBObjectStore, record: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.add(record); // add: 새 레코드만 추가 (중복 시 에러)
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 모든 레코드 조회 헬퍼
   * @param store - 객체 스토어 또는 인덱스
   * @returns 모든 레코드 배열
   */
  private getAllRecords<T>(store: IDBObjectStore | IDBIndex): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll(); // 모든 레코드 한 번에 조회
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  //           유틸리티 메서드
  // ==========================================

  /**
   * 모든 데이터 삭제 (개발/테스트용)
   * 주의: 모든 구매 데이터가 영구 삭제됩니다
   * @returns Promise<void>
   */
  async clearAllData(): Promise<void> {
    // DB 초기화 확인
    if (!this.db) await this.init();

    // 읽기/쓰기 트랜잭션 (두 스토어 모두)
    const transaction = this.db!.transaction(
      ['purchaseHistory', 'completedPurchases'],
      'readwrite',
    );

    // 스토어 참조
    const historyStore = transaction.objectStore('purchaseHistory');
    const completedStore = transaction.objectStore('completedPurchases');

    // 두 스토어 모두 클리어
    await new Promise<void>((resolve, reject) => {
      const clearHistory = historyStore.clear();
      const clearCompleted = completedStore.clear();

      // 체이닝으로 순차 처리
      clearHistory.onsuccess = () => {
        clearCompleted.onsuccess = () => {
          console.log('All purchase data cleared');
          resolve();
        };
        clearCompleted.onerror = () => reject(clearCompleted.error);
      };
      clearHistory.onerror = () => reject(clearHistory.error);
    });
  }
}

// ==========================================
//           싱글톤 인스턴스 내보내기
// ==========================================

// 하나의 인스턴스만 생성되어 앱 전체에서 공유
const purchaseDataStorage = new PurchaseDataStorage();
export default purchaseDataStorage;
