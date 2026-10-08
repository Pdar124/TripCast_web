export type WalkthroughSpot = {
  id: string;
  name: string;
  sky: '맑음' | '구름많음' | '흐림';
  temperature: number;
  rainProbability: number;
};

export type WalkthroughRecommendation = {
  id: string;
  title: string;
  description: string;
  grade: '매우좋음' | '좋음' | '보통';
};

export const walkthroughData = {
  destination: '경주',
  spots: [
    { id: 'bulguksa', name: '불국사', sky: '맑음', temperature: 23, rainProbability: 10 },
    { id: 'hwangridan', name: '황리단길', sky: '맑음', temperature: 24, rainProbability: 10 },
    { id: 'daereungwon', name: '대릉원', sky: '구름많음', temperature: 22, rainProbability: 20 },
    { id: 'donggung', name: '동궁과 월지', sky: '흐림', temperature: 19, rainProbability: 40 },
  ] satisfies WalkthroughSpot[],
  climate: {
    grade: '좋음' as const,
    description: '야외 관광을 즐기기 좋은 쾌적한 날이에요.',
  },
  recommendations: [
    {
      id: 'night',
      title: '경주 야경 코스',
      description: '대릉원에서 동궁과 월지까지',
      grade: '매우좋음',
    },
    {
      id: 'history',
      title: '경주 역사 코스',
      description: '불국사와 신라 유적을 따라',
      grade: '좋음',
    },
    {
      id: 'culture',
      title: '경주 문화 코스',
      description: '황리단길에서 즐기는 하루',
      grade: '보통',
    },
  ] satisfies WalkthroughRecommendation[],
} as const;

export const climateGrades = [
  { grade: '매우좋음', description: '관광 활동에 매우 쾌적해요.' },
  { grade: '좋음', description: '여행하기 좋은 날이에요.' },
  { grade: '보통', description: '일정을 무리 없이 즐길 수 있어요.' },
  { grade: '나쁨', description: '날씨 변화에 대비가 필요해요.' },
  { grade: '매우나쁨', description: '실내 일정도 함께 검토해 보세요.' },
] as const;

export const walkthroughSteps = [
  {
    id: 'search',
    eyebrow: '01 · SEARCH',
    title: '어디로 떠나고 싶나요?',
    description: '여행지를 검색하면 TripCast가 관광지와 오늘의 날씨를 함께 찾아드려요.',
  },
  {
    id: 'weather',
    eyebrow: '02 · WEATHER',
    title: '한눈에 보는 여행지 날씨',
    description: '관광지를 선택하면 기온과 하늘 상태, 강수확률을 바로 확인할 수 있어요.',
  },
  {
    id: 'course',
    eyebrow: '03 · COURSE',
    title: '한 곳에서 여행 전체로',
    description: 'TripCast는 관광지를 방문 순서대로 연결하고 코스 전체의 날씨를 보여줘요.',
  },
  {
    id: 'climate',
    eyebrow: '04 · CLIMATE',
    title: '그래서 오늘, 여행하기 좋은가요?',
    description: '관광기후지수 등급으로 오늘의 쾌적도를 이해하기 쉽게 비교할 수 있어요.',
  },
  {
    id: 'recommendation',
    eyebrow: '05 · RECOMMEND',
    title: '오늘 가장 좋은 코스를 먼저',
    description: '코스별 날씨와 관광기후지수를 바탕으로 지금 떠나기 좋은 순서를 알려드려요.',
  },
] as const;

export type WalkthroughStepId = (typeof walkthroughSteps)[number]['id'];
