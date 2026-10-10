import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RecommendationPage } from '@/features/courses/pages/recommendation-page';
import type { CourseRecommendation } from '@/features/courses/types';
import { http } from '@/shared/api/http';

function renderPage(initialEntry = '/recommendations') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <RecommendationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const spotNames = ['경복궁', '한강공원', '남산', '창덕궁', '북촌', '인사동'];

const recommendations: CourseRecommendation[] = spotNames.map((name, index) => ({
  courseId: 11 + index,
  sourceCourseId: `COURSE-0${11 + index}`,
  representativeSpotName: name,
  representativeThemeName: '역사',
  stopCount: 3,
  climateIndex: {
    regionId: '1111000000',
    date: '2026-10-03',
    score: 91 - index,
    grade: '좋음',
  },
}));

describe('RecommendationPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('최대 20개를 한 번에 조회하고 4개씩 나누어 보여 준다', async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: recommendations,
    } as AxiosResponse<CourseRecommendation[]>);

    renderPage();

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith('/api/tour-courses/recommendations', {
        params: { limit: 20 },
      }),
    );
    expect(
      await screen.findByRole('heading', { name: '경복궁에서 시작하는 코스' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('list', { name: '추천 코스 목록' })).toHaveClass(
      'grid',
      'md:grid-cols-2',
    );
    expect(screen.getAllByTestId('course-roadview-thumbnail')[0]).toHaveClass(
      'aspect-[16/9]',
      'w-full',
    );
    expect(screen.getByLabelText('1위')).toBeInTheDocument();
    expect(screen.getByLabelText('4위')).toBeInTheDocument();
    expect(screen.queryByLabelText('5위')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /경복궁에서 시작하는 코스/ })).toHaveAttribute(
      'href',
      '/courses/11',
    );

    await user.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(
      await screen.findByRole('heading', { name: '북촌에서 시작하는 코스' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByLabelText('5위')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '경복궁에서 시작하는 코스' })).toBeNull();
    // 페이지를 넘겨도 추천 API는 다시 부르지 않는다.
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('범위를 벗어난 page는 마지막 페이지로 맞춘다', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({
      data: recommendations,
    } as AxiosResponse<CourseRecommendation[]>);

    renderPage('/recommendations?page=9');

    expect(
      await screen.findByRole('heading', { name: '북촌에서 시작하는 코스' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();
  });

  it('추천 결과가 없으면 관광기후지수 수집 안내를 표시한다', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({ data: [] } as unknown as AxiosResponse<
      CourseRecommendation[]
    >);

    renderPage();

    expect(await screen.findByText('추천할 코스가 아직 없습니다')).toBeInTheDocument();
    expect(
      screen.getByText(/관광기후지수 데이터가 아직 수집되지 않았을 수 있습니다/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '페이지 이동' })).not.toBeInTheDocument();
  });
});
