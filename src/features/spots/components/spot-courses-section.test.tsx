import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SpotCoursesSection } from '@/features/spots/components/spot-courses-section';
import type { TourSpotCourse } from '@/features/spots/types';
import { http } from '@/shared/api/http';

const course: TourSpotCourse = {
  courseId: 10,
  sourceCourseId: 'C-010',
  representativeSpotName: '경복궁',
  representativeThemeName: '역사문화',
  stopCount: 3,
  startLatitude: 37.5796,
  startLongitude: 126.977,
  endLatitude: 37.5512,
  endLongitude: 126.9882,
  spotCourseOrder: 2,
};

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SpotCoursesSection spotId="7" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SpotCoursesSection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('관광지가 포함된 코스를 코스 상세로 가는 링크로 보여 준다', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: [course, { ...course, courseId: 11, representativeSpotName: null, spotCourseOrder: 1 }],
    } as AxiosResponse<TourSpotCourse[]>);

    renderSection();

    expect(screen.getByRole('status')).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: /경복궁에서 시작하는 코스/ });
    expect(getSpy).toHaveBeenCalledWith('/api/tour-spots/7/courses');
    expect(link).toHaveAttribute('href', '/courses/10');
    expect(link).toHaveTextContent('정류지 3곳 · 이 관광지는 2번째 방문');
    expect(
      screen.getByRole('link', { name: /대표 관광지 정보 없음에서 시작하는 코스/ }),
    ).toHaveAttribute('href', '/courses/11');
  });

  it('포함된 코스가 없으면 섹션을 렌더링하지 않는다', async () => {
    const empty: TourSpotCourse[] = [];
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: empty,
    } as AxiosResponse<TourSpotCourse[]>);

    const { container } = renderSection();

    await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(container).toBeEmptyDOMElement();
  });

  it('조회에 실패하면 안내와 다시 시도 버튼을 보여 주고, 다시 시도하면 목록을 보여 준다', async () => {
    const user = userEvent.setup();
    const getSpy = vi
      .spyOn(http, 'get')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({ data: [course] } as AxiosResponse<TourSpotCourse[]>);

    renderSection();

    expect(await screen.findByText('포함된 코스를 불러오지 못했습니다.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('link', { name: /경복궁에서 시작하는 코스/ })).toBeVisible();
    expect(getSpy).toHaveBeenCalledTimes(2);
  });
});
