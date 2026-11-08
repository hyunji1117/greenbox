// app/lib/items/nameMatch.ts
// 품목 이름 찾기: 같은 재료의 다른 이름(계란과 달걀)이나 음성 인식이 한 글자 틀린 이름도 찾는다
// 냉장고 품목 찾기(음성 바)와 장보기 식재료 찾기에서 같은 기준을 쓴다

// 같은 재료를 부르는 이름들. 한 묶음 안의 이름은 서로 바꿔 찾는다
// 한 글자 이름(파 등)은 다른 이름 안에도 들어 있어(양파) 잘못 찾게 되므로 넣지 않는다
const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['계란', '달걀', '에그'],
  ['소고기', '쇠고기', '우육'],
  ['돼지고기', '돈육', '돼지'],
  ['닭고기', '닭', '치킨'],
  ['방울토마토', '체리토마토'],
  ['파프리카', '피망'],
  ['고구마', '군고구마'],
  ['우유', '밀크'],
  ['요거트', '요구르트'],
  ['치즈', '체다'],
  ['버터', '가염버터'],
  ['두부', '순두부'],
  ['새우', '대하'],
  ['오징어', '한치'],
  ['배추', '알배추'],
  ['양배추', '캐비지'],
  ['감자', '알감자'],
  ['깻잎', '들깻잎'],
  ['고추', '청양고추', '풋고추'],
  ['마늘', '다진마늘', '깐마늘'],
  ['생강', '진저'],
  ['간장', '진간장', '양조간장'],
  ['케첩', '케찹'],
  ['마요네즈', '마요'],
  ['소시지', '소세지'],
  ['햄', '스팸'],
  ['어묵', '오뎅'],
];

// 띄어쓰기와 대소문자, 끝의 문장 부호를 무시한다 ("방울 토마토."도 "방울토마토")
export function normalizeName(text: string): string {
  return text.replace(/[\s.,!?。]+/gu, '').toLowerCase();
}

const GROUPS = SYNONYM_GROUPS.map(group => group.map(normalizeName));

// 동의어 묶음에 든 모든 이름 (식재료 이름 확인용)
export const synonymWords = () => SYNONYM_GROUPS.flat();

// 찾는 말과 같은 재료로 볼 이름들 (찾는 말 자신 포함)
// "달걀" → 달걀, 계란, 에그 / "계란말이"처럼 이름 안에 들어 있어도 바꿔 본다 ("달걀말이")
export function nameVariants(query: string): string[] {
  const keyword = normalizeName(query);
  if (!keyword) return [];
  const variants = new Set([keyword]);
  for (const group of GROUPS) {
    for (const word of group) {
      if (!keyword.includes(word)) continue;
      for (const other of group) {
        if (other !== word) variants.add(keyword.replace(word, other));
      }
    }
  }
  return [...variants];
}

// 두 글자 사이 편집 거리가 limit 이하인지 (음성 인식이 한 글자 틀리거나 빠진 경우)
function withinEditDistance(a: string, b: string, limit: number): boolean {
  if (Math.abs(a.length - b.length) > limit) return false;
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > limit) return false;
    previous = current;
  }
  return previous[b.length] <= limit;
}

// 0: 이름이 같음 / 1: 앞부분이 같음 / 2: 이름 안에 들어 있음 / 3: 한 글자 정도 다름 / null: 다름
export function matchScore(name: string, query: string): number | null {
  const target = normalizeName(name);
  const variants = nameVariants(query);
  if (!target || variants.length === 0) return null;
  if (variants.some(v => target === v)) return 0;
  if (variants.some(v => target.startsWith(v))) return 1;
  if (variants.some(v => target.includes(v))) return 2;
  // 세 글자 이상일 때만 한 글자 차이를 봐 준다 (두 글자는 다른 재료와 헷갈리기 쉽다)
  if (variants.some(v => v.length >= 3 && withinEditDistance(target, v, 1))) {
    return 3;
  }
  return null;
}

// 이름이 맞는 것만 가까운 순으로
export function findByName<T extends { name: string }>(
  items: readonly T[],
  query: string,
): T[] {
  return items
    .map(item => ({ item, score: matchScore(item.name, query) }))
    .filter(
      (entry): entry is { item: T; score: number } => entry.score !== null,
    )
    .sort((a, b) => a.score - b.score)
    .map(entry => entry.item);
}
