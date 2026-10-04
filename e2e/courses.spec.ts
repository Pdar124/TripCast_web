import { expect, test } from '@playwright/test';

import { courseSummaries, courseWeather, recommendations } from './support/fixtures';
import { mockApi, pageOf } from './support/mock-api';

test('관광코스 목록에서 상세로 이동해 정류지와 날씨를 확인한다', async ({ page }) => {
  await mockApi(page, [
    { path: '/api/tour-courses', respond: () => ({ body: pageOf(courseSummaries) }) },
    { path: '/api/tour-courses/10/weather', respond: () => ({ body: courseWeather }) },
  ]);

  await page.goto('/courses');
  await expect(page.getByRole('heading', { level: 1, name: '관광코스' })).toBeVisible();

  await page.getByRole('link', { name: /경복궁에서 시작하는 코스/ }).click();

  await expect(page).toHaveURL(/\/courses\/10$/);
  await expect(
    page.getByRole('heading', { level: 1, name: '경복궁에서 시작하는 코스' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '국립고궁박물관' })).toBeVisible();
  await expect(page.getByText('이동 12분')).toBeVisible();
  // 날씨 조회에 실패한 정류지도 나머지 정보는 그대로 보여 준다.
  await expect(page.getByText('날씨 정보를 불러오지 못했습니다')).toBeVisible();
});

test('코스 목록 API가 실패하면 다시 시도할 수 있다', async ({ page }) => {
  // 앱의 쿼리 재시도(retry: 1)까지 실패시킨 뒤, 사용자가 "다시 시도"를 누르면 성공한다.
  let attempts = 0;
  await mockApi(page, [
    {
      path: '/api/tour-courses',
      respond: () => {
        attempts += 1;
        return attempts <= 2
          ? { status: 500, body: { status: 500, message: '서버 오류가 발생했습니다.' } }
          : { body: pageOf(courseSummaries) };
      },
    },
  ]);

  await page.goto('/courses');
  await expect(
    page.getByRole('heading', { name: '관광코스 목록을 불러오지 못했습니다' }),
  ).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: '다시 시도' }).click();

  await expect(page.getByRole('link', { name: /경복궁에서 시작하는 코스/ })).toBeVisible();
});

test('추천 코스를 개수별로 보고 코스 상세로 이동한다', async ({ page }) => {
  const requestedLimits: string[] = [];
  await mockApi(page, [
    {
      path: '/api/tour-courses/recommendations',
      respond: ({ url }) => {
        requestedLimits.push(url.searchParams.get('limit') ?? '');
        return { body: recommendations };
      },
    },
    {
      path: '/api/tour-courses/11/weather',
      respond: () => ({ body: { ...courseWeather, courseId: 11 } }),
    },
  ]);

  await page.goto('/recommendations');

  const items = page.getByRole('listitem').filter({ hasText: '에서 시작하는 코스' });
  await expect(items.first()).toContainText('성산일출봉');
  await expect(items.first()).toContainText('93점');
  await expect(items.nth(1)).toContainText('경복궁');

  await page.getByRole('button', { name: '10개' }).click();
  await expect(page).toHaveURL(/limit=10/);
  await expect.poll(() => requestedLimits).toContain('10');

  await page.getByRole('link', { name: /성산일출봉에서 시작하는 코스/ }).click();
  await expect(page).toHaveURL(/\/courses\/11$/);
});
