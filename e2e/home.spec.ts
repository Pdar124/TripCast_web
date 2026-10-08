import { expect, test } from '@playwright/test';

import { recommendations } from './support/fixtures';
import { mockApi } from './support/mock-api';

test('홈 화면을 표시한다', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await mockApi(page, [
    { path: '/api/tour-courses/recommendations', respond: () => ({ body: recommendations }) },
  ]);

  await page.goto('/');

  await expect(page).toHaveTitle('TripCast');
  await expect(page.getByRole('heading', { level: 1, name: /여행 가기 좋은 날씨/ })).toBeVisible();
  await expect(page.locator('#hero canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('hero-scene-placeholder')).toHaveCSS('opacity', '0', {
    timeout: 20_000,
  });
  await expect(page.getByRole('link', { name: /성산일출봉에서 시작하는 코스/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '스크롤하며 미리 떠나보세요' })).toBeVisible();
  await expect(page.getByRole('link', { name: '사용 흐름 다시 보기' })).toHaveAttribute(
    'href',
    '#walkthrough',
  );
  expect(pageErrors).toEqual([]);
});

test('히어로 검색과 Walkthrough 이동 링크가 동작한다', async ({ page }) => {
  await mockApi(page, [
    { path: '/api/tour-courses/recommendations', respond: () => ({ body: recommendations }) },
    {
      path: '/api/tour-spots',
      respond: () => ({
        body: { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 },
      }),
    },
  ]);

  await page.goto('/');
  await page.getByRole('searchbox', { name: '관광지 검색어' }).fill('경주');
  await page.getByRole('button', { name: /여행지 찾기/ }).click();
  await expect(page).toHaveURL(/\/spots\?keyword=%EA%B2%BD%EC%A3%BC$/);
});

test('스크롤 진행에 따라 Stage가 변하고 위로 스크롤하면 되돌아간다', async ({ page }) => {
  await mockApi(page, [
    { path: '/api/tour-courses/recommendations', respond: () => ({ body: recommendations }) },
  ]);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  const walkthrough = page.locator('#walkthrough');
  await walkthrough.scrollIntoViewIfNeeded();
  const course = page.getByTestId('course-preview');
  const search = page.getByTestId('search-preview');
  const initialSearchStyle = await search.getAttribute('style');
  const initialCourseStyle = await course.getAttribute('style');

  await page.evaluate(`(() => {
    const section = document.querySelector('#walkthrough');
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + section.clientHeight * 0.58);
  })()`);
  await expect.poll(() => course.getAttribute('style')).not.toBe(initialCourseStyle);
  await expect.poll(() => search.getAttribute('style')).not.toBe(initialSearchStyle);

  await page.evaluate(`(() => {
    const section = document.querySelector('#walkthrough');
    if (!section) return;
    window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY);
  })()`);
  await expect.poll(() => search.getAttribute('style')).toBe(initialSearchStyle);
});
