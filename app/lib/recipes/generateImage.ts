// app/lib/recipes/generateImage.ts
// 레시피 그림을 OpenAI 이미지 API로 만든다 (서버 전용)
// 보내는 것은 요리 이름, 재료 이름, 단계 설명뿐이다. 누구의 냉장고인지는 보내지 않는다

// "빠른 일상 이미지 생성"용 모델. 완성 사진은 중간 품질, 단계 그림은 낮은 품질로 비용을 줄인다
const MODEL = 'gpt-image-2.6-flare';

export type ImageQuality = 'low' | 'medium';

export type ImageResult =
  | { status: 'ok'; mime: string; content: Buffer }
  | { status: 'unavailable' }
  | { status: 'failed' };

const STYLE =
  'Realistic home-cooking photo, soft natural light, simple Korean home kitchen, no text, no words, no logos, no people faces';

export function heroPrompt(title: string, ingredientNames: string[]): string {
  return `${STYLE}. Finished dish "${title}" plated in a simple bowl, made with ${ingredientNames.join(', ')}. Appetizing, close-up, 45-degree angle.`;
}

export function stepPrompt(title: string, stepText: string): string {
  return `${STYLE}. Cooking step for "${title}": ${stepText}. Show the pan, cutting board or bowl and hands only, clear and easy to follow.`;
}

export async function generateImage(
  prompt: string,
  quality: ImageQuality,
): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { status: 'unavailable' };
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        size: '1024x1024',
        quality,
        output_format: 'webp',
        output_compression: 70,
        n: 1,
      }),
      // 이미지 한 장은 수십 초까지 걸릴 수 있다
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      // 응답 본문에 요청 내용이 섞일 수 있어 상태만 남긴다
      console.error('레시피 그림 만들기 실패:', res.status);
      return { status: 'failed' };
    }
    const json = (await res.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) return { status: 'failed' };
    return {
      status: 'ok',
      mime: 'image/webp',
      content: Buffer.from(b64, 'base64'),
    };
  } catch (error) {
    console.error('레시피 그림 만들기 실패:', (error as Error).name);
    return { status: 'failed' };
  }
}
