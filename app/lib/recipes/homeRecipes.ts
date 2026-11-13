// app/lib/recipes/homeRecipes.ts
// 선반 보기 아래 "오늘 뭐 먹지"에 쓰는 집밥 레시피 목록 (앱에 들어 있어 외부로 보내는 것이 없다)
// 무엇을 먹을지 정해야 장을 보므로, 냉장고 재료와 계절, 날씨로 고르고 빠진 재료는 장보기에 바로 담는다
// seasons가 비어 있으면 사계절, moods는 그 날씨에 더 어울리는 요리 (cold: 추운 날, hot: 더운 날, rain: 비나 눈 오는 날)

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type WeatherMood = 'cold' | 'hot' | 'rain' | 'mild';

export interface HomeRecipe {
  id: string;
  title: string;
  minutes: number;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  seasons: Season[];
  moods: WeatherMood[];
}

export const HOME_RECIPES: HomeRecipe[] = [
  {
    id: 'kimchi-stew',
    title: '김치찌개',
    minutes: 25,
    ingredients: [
      { name: '김치', amount: '한 대접' },
      { name: '돼지고기', amount: '한 줌' },
      { name: '두부', amount: '반 모' },
      { name: '대파', amount: '반 대' },
    ],
    steps: [
      '냄비에 기름을 두르고 돼지고기와 김치를 중불에 5분 볶아요',
      '물 2컵을 붓고 끓으면 10분 더 끓여요',
      '두부와 대파를 넣고 5분 더 끓여요',
    ],
    seasons: [],
    moods: ['cold', 'rain'],
  },
  {
    id: 'doenjang-stew',
    title: '된장찌개',
    minutes: 20,
    ingredients: [
      { name: '애호박', amount: '1/3개' },
      { name: '두부', amount: '반 모' },
      { name: '양파', amount: '반 개' },
      { name: '감자', amount: '1개' },
      { name: '대파', amount: '반 대' },
    ],
    steps: [
      '물 2컵에 된장 2큰술을 풀어 끓여요',
      '감자, 양파, 애호박을 넣고 중불에 10분 끓여요',
      '두부와 대파를 넣고 3분 더 끓여요',
    ],
    seasons: [],
    moods: ['cold', 'rain', 'mild'],
  },
  {
    id: 'egg-roll',
    title: '계란말이',
    minutes: 10,
    ingredients: [
      { name: '계란', amount: '3개' },
      { name: '당근', amount: '조금' },
      { name: '대파', amount: '조금' },
    ],
    steps: [
      '계란을 풀고 잘게 썬 당근과 대파, 소금 한 꼬집을 섞어요',
      '약불 팬에 반을 붓고 익으면 돌돌 말아요',
      '나머지를 이어 붓고 다시 말아 한 김 식혀 썰어요',
    ],
    seasons: [],
    moods: ['mild', 'cold', 'hot', 'rain'],
  },
  {
    id: 'potato-stirfry',
    title: '감자채볶음',
    minutes: 15,
    ingredients: [
      { name: '감자', amount: '2개' },
      { name: '양파', amount: '반 개' },
    ],
    steps: [
      '감자를 얇게 채 썰어 찬물에 5분 담가 전분을 빼요',
      '기름 두른 팬에 감자와 양파를 중불에 7분 볶아요',
      '소금, 후추로 간하고 깨를 뿌려요',
    ],
    seasons: [],
    moods: ['mild'],
  },
  {
    id: 'tofu-braise',
    title: '두부조림',
    minutes: 15,
    ingredients: [
      { name: '두부', amount: '1모' },
      { name: '대파', amount: '반 대' },
    ],
    steps: [
      '두부를 도톰하게 썰어 기름 두른 팬에 앞뒤로 노릇하게 구워요',
      '간장 3큰술, 물 반 컵, 고춧가루, 다진 마늘을 섞어 부어요',
      '대파를 올리고 약불에 5분 졸여요',
    ],
    seasons: [],
    moods: ['mild', 'cold'],
  },
  {
    id: 'spicy-pork',
    title: '제육볶음',
    minutes: 20,
    ingredients: [
      { name: '돼지고기', amount: '300g' },
      { name: '양파', amount: '1개' },
      { name: '대파', amount: '1대' },
    ],
    steps: [
      '고추장 2큰술, 간장 1큰술, 설탕, 다진 마늘로 양념을 만들어요',
      '돼지고기를 양념에 버무려 센불에 속까지 익도록 볶아요',
      '양파와 대파를 넣고 3분 더 볶아요',
    ],
    seasons: [],
    moods: ['mild', 'cold'],
  },
  {
    id: 'beef-radish-soup',
    title: '소고기무국',
    minutes: 30,
    ingredients: [
      { name: '소고기', amount: '한 줌' },
      { name: '무', amount: '1/4개' },
      { name: '대파', amount: '반 대' },
    ],
    steps: [
      '냄비에 참기름을 두르고 소고기와 납작 썬 무를 5분 볶아요',
      '물 4컵을 붓고 무가 투명해질 때까지 20분 끓여요',
      '국간장과 소금으로 간하고 대파를 넣어요',
    ],
    seasons: ['autumn', 'winter'],
    moods: ['cold'],
  },
  {
    id: 'kimchi-pancake',
    title: '김치전',
    minutes: 15,
    ingredients: [
      { name: '김치', amount: '한 대접' },
      { name: '부침가루', amount: '1컵' },
      { name: '양파', amount: '반 개' },
    ],
    steps: [
      '김치를 잘게 썰고 부침가루, 물 2/3컵, 양파를 섞어요',
      '기름을 넉넉히 두른 팬에 얇게 펴요',
      '중불에 앞뒤로 3분씩 바삭하게 부쳐요',
    ],
    seasons: [],
    moods: ['rain'],
  },
  {
    id: 'seafood-scallion-pancake',
    title: '해물파전',
    minutes: 20,
    ingredients: [
      { name: '대파', amount: '2대' },
      { name: '오징어', amount: '반 마리' },
      { name: '새우', amount: '한 줌' },
      { name: '부침가루', amount: '1컵' },
    ],
    steps: [
      '부침가루에 물 2/3컵을 풀어 반죽을 만들어요',
      '팬에 대파를 깔고 반죽과 해물을 올려요',
      '중불에 앞뒤로 4분씩, 해물이 완전히 익을 때까지 부쳐요',
    ],
    seasons: [],
    moods: ['rain'],
  },
  {
    id: 'bean-sprout-soup',
    title: '콩나물국',
    minutes: 15,
    ingredients: [
      { name: '콩나물', amount: '한 봉지' },
      { name: '대파', amount: '반 대' },
    ],
    steps: [
      '물 4컵에 콩나물을 넣고 뚜껑을 덮어 10분 끓여요',
      '다진 마늘과 소금으로 간해요',
      '대파를 넣고 1분 더 끓여요',
    ],
    seasons: [],
    moods: ['cold', 'rain'],
  },
  {
    id: 'spicy-noodles',
    title: '비빔국수',
    minutes: 15,
    ingredients: [
      { name: '소면', amount: '1인분' },
      { name: '오이', amount: '반 개' },
      { name: '김치', amount: '조금' },
      { name: '계란', amount: '1개' },
    ],
    steps: [
      '계란을 12분 삶고 오이는 채 썰어요',
      '소면을 4분 삶아 찬물에 비벼 헹궈요',
      '고추장 2큰술, 식초, 설탕, 참기름 양념에 비비고 고명을 올려요',
    ],
    seasons: ['summer'],
    moods: ['hot'],
  },
  {
    id: 'cucumber-cold-soup',
    title: '오이냉국',
    minutes: 10,
    ingredients: [
      { name: '오이', amount: '1개' },
      { name: '미역', amount: '한 줌' },
    ],
    steps: [
      '불린 미역과 채 썬 오이를 그릇에 담아요',
      '찬물 3컵에 식초 3큰술, 설탕, 소금을 녹여 부어요',
      '얼음을 띄우고 깨를 뿌려요',
    ],
    seasons: ['summer'],
    moods: ['hot'],
  },
  {
    id: 'tomato-egg',
    title: '토마토달걀볶음',
    minutes: 10,
    ingredients: [
      { name: '토마토', amount: '2개' },
      { name: '계란', amount: '3개' },
      { name: '대파', amount: '조금' },
    ],
    steps: [
      '계란을 풀어 기름 두른 팬에 반쯤 익혀 덜어 둬요',
      '대파와 토마토를 중불에 3분 볶아요',
      '계란을 다시 넣고 소금으로 간해 1분 볶아요',
    ],
    seasons: [],
    moods: ['mild', 'hot'],
  },
  {
    id: 'mushroom-stirfry',
    title: '버섯볶음',
    minutes: 10,
    ingredients: [
      { name: '버섯', amount: '한 팩' },
      { name: '양파', amount: '반 개' },
    ],
    steps: [
      '버섯은 먹기 좋게 찢고 양파는 채 썰어요',
      '기름 두른 팬에 센불로 4분 볶아요',
      '간장 1큰술과 참기름으로 마무리해요',
    ],
    seasons: ['autumn'],
    moods: ['mild'],
  },
  {
    id: 'chicken-stew',
    title: '닭볶음탕',
    minutes: 40,
    ingredients: [
      { name: '닭', amount: '1마리' },
      { name: '감자', amount: '2개' },
      { name: '당근', amount: '반 개' },
      { name: '양파', amount: '1개' },
    ],
    steps: [
      '닭을 끓는 물에 5분 데쳐 헹궈요',
      '물 3컵, 고추장, 간장, 고춧가루, 다진 마늘을 넣고 20분 끓여요',
      '감자, 당근, 양파를 넣고 닭이 속까지 익도록 15분 더 끓여요',
    ],
    seasons: ['autumn', 'winter'],
    moods: ['cold', 'rain'],
  },
  {
    id: 'rice-cake-soup',
    title: '떡국',
    minutes: 20,
    ingredients: [
      { name: '떡', amount: '2인분' },
      { name: '계란', amount: '1개' },
      { name: '대파', amount: '반 대' },
    ],
    steps: [
      '떡을 찬물에 10분 불려요',
      '육수나 물 4컵이 끓으면 떡을 넣고 떠오를 때까지 끓여요',
      '계란을 풀어 두르고 대파를 넣어 국간장으로 간해요',
    ],
    seasons: ['winter'],
    moods: ['cold'],
  },
  {
    id: 'shrimp-fried-rice',
    title: '새우볶음밥',
    minutes: 15,
    ingredients: [
      { name: '새우', amount: '한 줌' },
      { name: '밥', amount: '1공기' },
      { name: '계란', amount: '1개' },
      { name: '양파', amount: '반 개' },
    ],
    steps: [
      '기름 두른 팬에 양파와 새우를 새우가 완전히 익을 때까지 볶아요',
      '밥을 넣고 센불에 3분 볶아요',
      '한쪽에 계란을 스크램블해 섞고 소금, 간장으로 간해요',
    ],
    seasons: [],
    moods: ['mild', 'hot'],
  },
  {
    id: 'zucchini-pancake',
    title: '애호박전',
    minutes: 15,
    ingredients: [
      { name: '애호박', amount: '1개' },
      { name: '계란', amount: '2개' },
    ],
    steps: [
      '애호박을 동그랗게 썰어 소금을 살짝 뿌려요',
      '밀가루를 묻히고 푼 계란을 입혀요',
      '중불에 앞뒤로 노릇하게 부쳐요',
    ],
    seasons: ['summer', 'autumn'],
    moods: ['rain', 'mild'],
  },
  {
    id: 'spinach-namul',
    title: '시금치나물',
    minutes: 10,
    ingredients: [{ name: '시금치', amount: '한 단' }],
    steps: [
      '끓는 물에 소금을 넣고 시금치를 30초 데쳐요',
      '찬물에 헹궈 물기를 꼭 짜요',
      '국간장, 다진 마늘, 참기름, 깨로 무쳐요',
    ],
    seasons: ['winter', 'spring'],
    moods: ['mild', 'cold'],
  },
  {
    id: 'oyster-pancake',
    title: '굴전',
    minutes: 15,
    ingredients: [
      { name: '굴', amount: '한 봉지' },
      { name: '계란', amount: '2개' },
    ],
    steps: [
      '굴을 소금물에 살살 헹궈 물기를 빼요',
      '밀가루를 묻히고 푼 계란을 입혀요',
      '중불에 앞뒤로 속까지 익도록 부쳐요',
    ],
    seasons: ['winter'],
    moods: ['cold'],
  },
  {
    id: 'cabbage-tuna-bowl',
    title: '양배추참치덮밥',
    minutes: 15,
    ingredients: [
      { name: '양배추', amount: '1/4통' },
      { name: '참치', amount: '1캔' },
      { name: '밥', amount: '1공기' },
    ],
    steps: [
      '양배추를 채 썰어 기름 두른 팬에 4분 볶아요',
      '기름 뺀 참치와 간장 1큰술, 설탕 조금을 넣어 2분 볶아요',
      '밥 위에 올리고 참기름을 둘러요',
    ],
    seasons: [],
    moods: ['mild'],
  },
  {
    id: 'sweet-potato-candied',
    title: '고구마맛탕',
    minutes: 25,
    ingredients: [{ name: '고구마', amount: '2개' }],
    steps: [
      '고구마를 한입 크기로 썰어 물기를 닦아요',
      '기름을 넉넉히 두른 팬에 약불로 15분 익혀요',
      '기름을 덜어 내고 설탕 3큰술을 녹여 버무려요',
    ],
    seasons: ['autumn', 'winter'],
    moods: ['cold', 'mild'],
  },
];
