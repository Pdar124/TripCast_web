import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CourseDetailPage } from '@/features/courses/pages/course-detail-page';
import type { TourCourse, TourCourseWeather } from '@/features/courses/types';
import { http } from '@/shared/api/http';

function renderPage(initialEntry = '/courses/7') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<CourseDetailPage />} path="/courses/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const courseWeather = {
  courseId: 7,
  sourceCourseId: 'COURSE-007',
  stops: [
    {
      spot: {
        stopId: 72,
        sourceSpotId: 'SPOT-002',
        tourSpotId: 102,
        tourSpotName: '두 번째 관광지',
        latitude: 37.57,
        longitude: 126.98,
        regionId: '1111000000',
        courseOrder: 2,
        travelTime: 25,
        indoorType: '새로운 구분',
        themeCode: 'TH02',
        themeName: '문화',
      },
      climateIndex: null,
      weather: null,
    },
    {
      spot: {
        stopId: 71,
        sourceSpotId: 'SPOT-001',
        tourSpotId: 101,
        tourSpotName: '첫 번째 관광지',
        latitude: 37.58,
        longitude: 126.97,
        regionId: '1111000000',
        courseOrder: 1,
        travelTime: 0,
        indoorType: '실외',
        themeCode: 'TH01',
        themeName: '역사',
      },
      climateIndex: {
        regionId: '1111000000',
        date: '2026-10-02',
        score: 82,
        grade: '좋음',
      },
      weather: {
        forecastDate: '20261002',
        forecastTime: '1500',
        temperature: 22,
        rainProbability: 10,
        sky: '맑음',
      },
    },
  ],
} as unknown as TourCourseWeather;

const course = {
  courseId: courseWeather.courseId,
  sourceCourseId: courseWeather.sourceCourseId,
  stops: courseWeather.stops.map(({ spot }) => spot),
} as TourCourse;

function mockCourseApi(weather: () => Promise<{ data: TourCourseWeather }>) {
  return vi.spyOn(http, 'get').mockImplementation((url: string) => {
    if (url === '/api/tour-courses/7') {
      return Promise.resolve({ data: course } as AxiosResponse<TourCourse>);
    }
    return weather() as Promise<AxiosResponse<TourCourseWeather>>;
  });
}

describe('CourseDetailPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('정류지를 방문 순서로 표시하고 일부 날씨 실패를 전체 실패로 처리하지 않는다', async () => {
    const getSpy = mockCourseApi(() => Promise.resolve({ data: courseWeather }));

    renderPage();

    await waitFor(() => expect(getSpy).toHaveBeenCalledWith('/api/tour-courses/7'));
    expect(getSpy).toHaveBeenCalledWith('/api/tour-courses/7/weather', { timeout: 15_000 });
    expect(
      await screen.findByRole('heading', { name: '첫 번째 관광지에서 시작하는 코스' }),
    ).toBeInTheDocument();

    const stopHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(stopHeadings.map((heading) => heading.textContent)).toEqual([
      '첫 번째 관광지',
      '두 번째 관광지',
    ]);
    expect(await screen.findByText('22°C')).toBeInTheDocument();
    expect(screen.getByText('지수 82')).toBeInTheDocument();
    expect(screen.getByText('날씨 정보를 불러오지 못했습니다')).toBeInTheDocument();
    expect(screen.getByText('구분 없음')).toBeInTheDocument();
    expect(screen.queryByText('새로운 구분')).not.toBeInTheDocument();
  });

  it('날씨가 도착하기 전에도 코스와 정류지를 먼저 표시한다', async () => {
    let resolveWeather: (value: { data: TourCourseWeather }) => void = () => {};
    mockCourseApi(
      () =>
        new Promise((resolve) => {
          resolveWeather = resolve;
        }),
    );

    renderPage();

    expect(
      await screen.findByRole('heading', { name: '첫 번째 관광지에서 시작하는 코스' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('날씨를 불러오는 중입니다')).toHaveLength(2);
    expect(screen.queryByText('22°C')).not.toBeInTheDocument();

    await act(async () => resolveWeather({ data: courseWeather }));

    expect(await screen.findByText('22°C')).toBeInTheDocument();
    expect(screen.queryByText('날씨를 불러오는 중입니다')).not.toBeInTheDocument();
  });

  it('날씨 API가 실패해도 코스 정보는 유지하고 날씨 영역만 대체 문구를 보여 준다', async () => {
    mockCourseApi(() => Promise.reject(new Error('timeout')));

    renderPage();

    expect(
      await screen.findByRole('heading', { name: '첫 번째 관광지에서 시작하는 코스' }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText('날씨 정보를 불러오지 못했습니다')).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(screen.queryByText('코스 정보를 불러오지 못했습니다')).not.toBeInTheDocument();
  });

  it('잘못된 코스 ID면 API를 호출하지 않는다', () => {
    const getSpy = vi.spyOn(http, 'get');

    renderPage('/courses/not-a-number');

    expect(screen.getByText('관광코스를 찾을 수 없습니다')).toBeInTheDocument();
    expect(getSpy).not.toHaveBeenCalled();
  });
});
