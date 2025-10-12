// app/lib/services/NotificationService.ts
// 유통기한 알림 서비스

interface NotificationSchedule {
  itemId: number;
  itemName: string;
  expiryDate: Date;
  notificationDate: Date;
  notificationTime: string;
  sent: boolean;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
}

class NotificationService {
  private static instance: NotificationService | null = null;
  private schedules: Map<number, NotificationSchedule> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      this.loadSchedules();
      this.startBackgroundCheck();
    }
  }

  static getInstance(): NotificationService | null {
    // 서버 사이드에서는 null 반환
    if (typeof window === 'undefined') {
      return null;
    }

    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 알림 권한 요청
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Service Worker 등록 확인
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('Service Worker 등록 실패:', error);
      return null;
    }
  }

  // 알림 스케줄 추가
  async scheduleNotification(
    itemId: number,
    itemName: string,
    expiryDate: Date,
    daysBefore: number,
    notificationTime: string,
  ): Promise<void> {
    const notificationDate = new Date(expiryDate);
    notificationDate.setDate(notificationDate.getDate() - daysBefore);

    // 알림 시간 설정
    const [hours, minutes] = notificationTime.split(':');
    notificationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const schedule: NotificationSchedule = {
      itemId,
      itemName,
      expiryDate,
      notificationDate,
      notificationTime,
      sent: false,
    };

    this.schedules.set(itemId, schedule);
    this.saveSchedules();

    // 즉시 알림이 필요한지 확인
    await this.checkAndSendNotifications();
  }

  // 알림 스케줄 제거
  removeSchedule(itemId: number): void {
    this.schedules.delete(itemId);
    this.saveSchedules();
  }

  // 알림 체크 및 전송
  private async checkAndSendNotifications(): Promise<void> {
    const now = new Date();

    for (const [, schedule] of this.schedules.entries()) {
      if (!schedule.sent && schedule.notificationDate <= now) {
        await this.sendNotification(schedule);
        schedule.sent = true;
        this.saveSchedules();
      }
    }
  }

  // 실제 알림 전송
  private async sendNotification(
    schedule: NotificationSchedule,
  ): Promise<void> {
    const registration = await this.registerServiceWorker();
    if (!registration) return;

    const permission = await this.requestPermission();
    if (!permission) return;

    const daysRemaining = Math.ceil(
      (schedule.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    const title = '🥛 유통기한 알림';
    const body = `${schedule.itemName} 유통기한 ${daysRemaining}일 남음!`;

    // 로컬 알림 (Service Worker 미지원 브라우저용)
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/our-fridge_logo2_192_bgwhite.png',
        badge: '/our-fridge_logo2_192_bgwhite.png',
        vibrate: [200, 100, 200],
        tag: `expiry-${schedule.itemId}`,
        requireInteraction: true,
      } as ExtendedNotificationOptions);
    }

    // Service Worker를 통한 푸시 알림
    if (registration.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: '/our-fridge_logo2_192_bgwhite.png',
        badge: '/our-fridge_logo2_192_bgwhite.png',
        vibrate: [200, 100, 200],
        data: {
          itemName: schedule.itemName,
          daysRemaining,
          itemId: schedule.itemId,
        },
        actions: [
          { action: 'view', title: '확인하기' },
          { action: 'dismiss', title: '나중에' },
        ],
        tag: `expiry-${schedule.itemId}`,
        requireInteraction: true,
      } as ExtendedNotificationOptions);
    }
  }

  // 백그라운드 체크 시작
  private startBackgroundCheck(): void {
    // 1분마다 체크
    this.checkInterval = setInterval(() => {
      this.checkAndSendNotifications();
    }, 60000);
  }

  // 백그라운드 체크 중지
  stopBackgroundCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // 로컬 스토리지에 스케줄 저장
  private saveSchedules(): void {
    if (typeof window === 'undefined') return;

    const data = Array.from(this.schedules.entries()).map(([id, schedule]) => ({
      id,
      ...schedule,
      expiryDate: schedule.expiryDate.toISOString(),
      notificationDate: schedule.notificationDate.toISOString(),
    }));
    localStorage.setItem('notification-schedules', JSON.stringify(data));
  }

  // 로컬 스토리지에서 스케줄 로드
  private loadSchedules(): void {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('notification-schedules');
    if (saved) {
      try {
        const data: Array<{
          itemId: number;
          itemName: string;
          expiryDate: string;
          notificationDate: string;
          notificationTime: string;
          sent: boolean;
        }> = JSON.parse(saved);

        data.forEach(item => {
          this.schedules.set(item.itemId, {
            ...item,
            expiryDate: new Date(item.expiryDate),
            notificationDate: new Date(item.notificationDate),
          });
        });
      } catch (error) {
        console.error('Failed to load schedules:', error);
      }
    }
  }

  // 테스트용 즉시 알림
  async sendTestNotification(): Promise<void> {
    const permission = await this.requestPermission();
    if (!permission) {
      alert('알림 권한이 필요합니다.');
      return;
    }

    const registration = await this.registerServiceWorker();
    if (registration && registration.showNotification) {
      await registration.showNotification('🥛 테스트 알림', {
        body: '우유 유통기한 3일 남음!',
        icon: '/our-fridge_logo2_192_bgwhite.png',
        badge: '/our-fridge_logo2_192_bgwhite.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
      } as ExtendedNotificationOptions);
    }
  }
}

// 조건부 export
const notificationService =
  typeof window !== 'undefined' ? NotificationService.getInstance() : null;

export default notificationService;

// export default NotificationService.getInstance();
