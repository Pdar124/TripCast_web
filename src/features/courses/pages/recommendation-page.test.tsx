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

const recommendations: CourseRecommendation[] = [
  {
    courseId: 11,
    sourceCourseId: 'COURSE-011',
    representativeSpotName: '경복궁',
    representativeThemeName: '역사',
    stopCount: 3,
    climateIndex: {
      regionId: '1111000000',
      date: '2026-10-03',
      score: 91,
      grade: '매우좋음',
    },
  },
  {
    courseId: 12,
    sourceCourseId: 'COURSE-012',
    representativeSpotName: '한강공원',
    representativeThemeName: '자연',
    stopCount: 4,
    climateIndex: {
      regionId: '1156000000',
      date: '2026-10-03',
      score: 84,
      grade: '좋음',
    },
  },
];

describe('RecommendationPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('기본 5개를 조회하고 표시 개수를 10개로 변경하면 다시 요청한다', async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: recommendations,
    } as AxiosResponse<CourseRecommendation[]>);

    renderPage();

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith('/api/tour-courses/recommendations', {
        params: { limit: 5 },
      }),
    );
    expect(
      await screen.findByRole('heading', { name: '경복궁에서 시작하는 코스' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('1위')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /경복궁에서 시작하는 코스/ })).toHaveAttribute(
      'href',
      '/courses/11',
    );

    await user.click(screen.getByRole('button', { name: '10개' }));

    await waitFor(() =>
      expect(getSpy).toHaveBeenLastCalledWith('/api/tour-courses/recommendations', {
        params: { limit: 10 },
      }),
    );
    expect(screen.getByRole('button', { name: '10개' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('추천 결과가 없으면 관광기후지수 수집 안내를 표시한다', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({ data: [] } as unknown as AxiosResponse<
      CourseRecommendation[]
    >);

    renderPage('/recommendations?limit=20');

    expect(await screen.findByText('추천할 코스가 아직 없습니다')).toBeInTheDocument();
    expect(
      screen.getByText(/관광기후지수 데이터가 아직 수집되지 않았을 수 있습니다/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '20개' })).toHaveAttribute('aria-pressed', 'true');
  });
});
