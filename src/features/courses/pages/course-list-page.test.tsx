import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CourseListPage } from '@/features/courses/pages/course-list-page';
import type { TourCoursePage } from '@/features/courses/types';
import { http } from '@/shared/api/http';

function renderPage(initialEntry = '/courses') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CourseListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CourseListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('URL의 0-based 페이지와 고정 size 20으로 관광코스를 조회한다', async () => {
    const page: TourCoursePage = {
      content: [
        {
          courseId: 7,
          representativeSpotName: '경복궁',
          representativeThemeName: '역사',
          sourceCourseId: 'COURSE-007',
          stopCount: 3,
        },
      ],
      number: 2,
      size: 20,
      totalElements: 61,
      totalPages: 4,
    };
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: page } as AxiosResponse);

    renderPage('/courses?page=2');

    await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(1));
    expect(getSpy).toHaveBeenCalledWith('/api/tour-courses', {
      params: { page: 2, size: 20 },
    });
    expect(
      await screen.findByRole('heading', { name: '경복궁에서 시작하는 코스' }),
    ).toBeInTheDocument();
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
  });

  it('대표 정보가 null이어도 안전한 대체 문구를 표시한다', async () => {
    const page: TourCoursePage = {
      content: [
        {
          courseId: 8,
          representativeSpotName: null,
          representativeThemeName: null,
          sourceCourseId: 'COURSE-008',
          stopCount: 0,
        },
      ],
      number: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    };
    vi.spyOn(http, 'get').mockResolvedValue({ data: page } as AxiosResponse);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: '대표 관광지 정보 없음에서 시작하는 코스' }),
    ).toBeInTheDocument();
    expect(screen.getByText('테마 정보 없음')).toBeInTheDocument();
  });
});
