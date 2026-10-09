export const weather = {
  forecastDate: '20260923',
  forecastTime: '0600',
  temperature: 21,
  rainProbability: 30,
  sky: '맑음',
};

export const goodIndex = { regionId: '1111000000', date: '2026-09-23', score: 82, grade: '좋음' };
export const excellentIndex = {
  regionId: '5013000000',
  date: '2026-09-23',
  score: 93,
  grade: '매우좋음',
};

export const spots = [
  { id: 1, name: '경복궁', latitude: 37.5796, longitude: 126.977 },
  { id: 2, name: '성산일출봉', latitude: 33.4581, longitude: 126.9426 },
];

export function spotWeather(id: number) {
  const spot = spots.find((candidate) => candidate.id === id) ?? spots[0];
  return {
    tourSpotId: spot.id,
    tourSpotName: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    weather,
    climateIndex: goodIndex,
  };
}

export const courseSummaries = [
  {
    courseId: 10,
    sourceCourseId: 'C-010',
    representativeSpotName: '경복궁',
    representativeThemeName: '역사문화',
    stopCount: 2,
  },
  {
    courseId: 11,
    sourceCourseId: 'C-011',
    representativeSpotName: '성산일출봉',
    representativeThemeName: '자연경관',
    stopCount: 1,
  },
];

export const courseWeather = {
  courseId: 10,
  sourceCourseId: 'C-010',
  stops: [
    {
      spot: {
        stopId: 101,
        sourceSpotId: 'S-1',
        tourSpotId: 1,
        tourSpotName: '경복궁',
        latitude: 37.5796,
        longitude: 126.977,
        regionId: '1111000000',
        courseOrder: 1,
        travelTime: 0,
        themeCode: 'TH01',
        themeName: '역사문화',
        indoorType: '실외',
      },
      climateIndex: goodIndex,
      weather,
    },
    {
      spot: {
        stopId: 102,
        sourceSpotId: 'S-2',
        tourSpotId: 3,
        tourSpotName: '국립고궁박물관',
        latitude: 37.5775,
        longitude: 126.9741,
        regionId: '1111000000',
        courseOrder: 2,
        travelTime: 12,
        themeCode: 'TH01',
        themeName: '역사문화',
        indoorType: '실내',
      },
      climateIndex: goodIndex,
      weather: null,
    },
  ],
};

/** 날씨 없이 코스·관광지 목록만 내려오는 상세 API 응답 */
export const course = {
  courseId: courseWeather.courseId,
  sourceCourseId: courseWeather.sourceCourseId,
  stops: courseWeather.stops.map(({ spot }) => spot),
};

export const recommendations = [
  {
    courseId: 11,
    sourceCourseId: 'C-011',
    representativeSpotName: '성산일출봉',
    representativeThemeName: '자연경관',
    stopCount: 1,
    climateIndex: excellentIndex,
  },
  {
    courseId: 10,
    sourceCourseId: 'C-010',
    representativeSpotName: '경복궁',
    representativeThemeName: '역사문화',
    stopCount: 2,
    climateIndex: goodIndex,
  },
];
