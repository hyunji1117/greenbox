// app/lib/shelves/doorSwipe.ts
// 냉장고 문을 손가락으로 밀어 열고 닫는 판정. 버튼(눌러서 열기, 문 닫기)은 그대로 두고 밀기는 덧붙인다
// - 닫혀 있을 때: 가운데(문이 맞닿는 곳)에서 시작해 옆으로 밀면 연다. 실제 양문을 여는 손 모양
// - 열려 있을 때: 양쪽 끝 쪽(폭의 35%, 최소 48px)에서 시작해 안쪽으로 밀면 닫는다
//   밀기로 판정되면 그 손길의 클릭은 막으므로 선반 위에서 시작해도 선반이 열리지 않는다
// - 세로로 더 많이 움직였으면 화면 스크롤로 보고 무시한다

export const DOOR_SWIPE_MIN_PX = 60;
export const DOOR_EDGE_BAND_PX = 48;
// 끝 띠가 48px이면 어디서 시작해야 닫히는지 찾기 어려워(dev 테스트에서 확인) 폭의 35%까지 넓힌다
const EDGE_BAND_RATIO = 0.35;
// 가운데 시작 범위: 폭의 가운데 절반
const CENTER_BAND_RATIO = 0.25;

export type DoorSwipeStart = 'center' | 'left-edge' | 'right-edge';

// 손가락을 댄 곳이 밀기를 시작할 수 있는 자리인지. x는 냉장고 왼쪽 끝에서 잰 거리
export function doorSwipeStart(
  x: number,
  width: number,
  isOpen: boolean,
): DoorSwipeStart | null {
  if (width <= 0) return null;
  if (!isOpen) {
    return Math.abs(x - width / 2) <= width * CENTER_BAND_RATIO
      ? 'center'
      : null;
  }
  const band = Math.max(DOOR_EDGE_BAND_PX, width * EDGE_BAND_RATIO);
  if (x <= band) return 'left-edge';
  if (x >= width - band) return 'right-edge';
  return null;
}

// 손을 뗐을 때 문을 열지, 닫을지, 그대로 둘지
export function doorSwipeResult(
  start: DoorSwipeStart | null,
  dx: number,
  dy: number,
): 'open' | 'close' | null {
  if (start === null) return null;
  if (Math.abs(dx) < DOOR_SWIPE_MIN_PX) return null;
  if (Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  if (start === 'center') return 'open';
  if (start === 'left-edge' && dx > 0) return 'close';
  if (start === 'right-edge' && dx < 0) return 'close';
  return null;
}
