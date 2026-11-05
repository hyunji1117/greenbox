// app/lib/vision/resizeImage.ts
// 찍은 사진을 보내기 전에 브라우저에서 줄인다
// 휴대폰 사진(수 MB)을 그대로 보내면 서버 요청 한도를 넘고 느리므로, 인식에 충분한 크기의 JPEG로 바꾼다

// 인식 모델이 그대로 읽는 크기. 이보다 크면 서버에서 다시 줄여 시간만 든다
export const MAX_IMAGE_EDGE = 1568;
const JPEG_QUALITY = 0.85;

export interface PreparedImage {
  base64: string;
  mediaType: 'image/jpeg';
}

export function fitWithin(
  width: number,
  height: number,
  maxEdge = MAX_IMAGE_EDGE,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  // 휴대폰이 사진에 적어 둔 회전 정보를 반영해 눕지 않게 한다
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas를 쓸 수 없습니다');
    context.drawImage(bitmap, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    return {
      base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
      mediaType: 'image/jpeg',
    };
  } finally {
    bitmap.close();
  }
}
