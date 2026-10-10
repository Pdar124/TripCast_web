import { expect, test } from '@playwright/test';

import { course, courseWeather, spotCourses, spotWeather, spots } from './support/fixtures';
import { mockApi, pageOf } from './support/mock-api';

test.beforeEach(async ({ page }) => {
  await mockApi(page, [
    {
      path: '/api/tour-spots',
      respond: ({ url }) => {
        const keyword = url.searchParams.get('keyword') ?? '';
        return { body: pageOf(spots.filter((spot) => spot.name.includes(keyword))) };
      },
    },
    {
      path: /^\/api\/tour-spots\/\d+\/weather$/,
      respond: ({ url }) => ({ body: spotWeather(Number(url.pathname.split('/')[3])) }),
    },
    {
      path: /^\/api\/tour-spots\/\d+\/courses$/,
      respond: ({ url }) => ({ body: url.pathname.split('/')[3] === '1' ? spotCourses : [] }),
    },
    { path: '/api/tour-courses/10', respond: () => ({ body: course }) },
    { path: '/api/tour-courses/10/weather', respond: () => ({ body: courseWeather }) },
  ]);
});

test('관광지를 검색해 상세 페이지로 이동한다', async ({ page }) => {
  await page.goto('/spots');
  await expect(page.getByRole('link', { name: /성산일출봉/ })).toBeVisible();

  await page.getByRole('searchbox', { name: '관광지 검색어' }).fill('경복');
  await page.getByRole('button', { name: '검색' }).click();

  await expect(page).toHaveURL(/\/spots\?keyword=/);
  await expect(page.getByRole('link', { name: /성산일출봉/ })).toHaveCount(0);
  await page.getByRole('link', { name: /경복궁/ }).click();

  await expect(page).toHaveURL(/\/spots\/1$/);
  await expect(page.getByRole('heading', { level: 1, name: '경복궁' })).toBeVisible();
  await expect(page.getByText('지수 82')).toBeVisible();
  await expect(page.getByText('21°')).toBeVisible();
  // 카카오맵 앱 키가 없는 환경에서는 플레이스홀더를 보여 준다.
  await expect(page.getByRole('heading', { name: '지도 영역' })).toBeVisible();
});

test('관광지 상세에서 포함된 코스로 바로 이동한다', async ({ page }) => {
  await page.goto('/spots/1');

  await expect(page.getByRole('heading', { name: '이 관광지가 포함된 코스' })).toBeVisible();
  await page.getByRole('link', { name: /경복궁에서 시작하는 코스/ }).click();

  await expect(page).toHaveURL(/\/courses\/10$/);
  await expect(
    page.getByRole('heading', { level: 1, name: '경복궁에서 시작하는 코스' }),
  ).toBeVisible();
});

test('포함된 코스가 없는 관광지는 코스 섹션을 숨긴다', async ({ page }) => {
  await page.goto('/spots/2');

  await expect(page.getByRole('heading', { level: 1, name: '성산일출봉' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '이 관광지가 포함된 코스' })).toHaveCount(0);
});

test('목록과 지도 보기를 전환한다', async ({ page }) => {
  await page.goto('/spots');

  await page.getByRole('button', { name: '지도' }).click();
  await expect(page).toHaveURL(/view=map/);
  await expect(page.getByRole('heading', { name: '지도 영역' })).toBeVisible();
  await expect(page.getByRole('link', { name: /경복궁/ })).toHaveCount(0);

  await page.getByRole('button', { name: '목록' }).click();
  await expect(page).not.toHaveURL(/view=map/);
  await expect(page.getByRole('link', { name: /경복궁/ })).toBeVisible();
});

test('검색 결과가 없으면 안내 문구를 보여 준다', async ({ page }) => {
  await page.goto('/spots');

  await page.getByRole('searchbox', { name: '관광지 검색어' }).fill('없는관광지');
  await page.getByRole('button', { name: '검색' }).click();

  await expect(page.getByRole('heading', { name: '검색 결과가 없습니다' })).toBeVisible();
});

test('새 페이지는 상단에서 시작하고 브라우저 뒤로/앞으로 가기는 위치를 복원한다', async ({
  page,
}) => {
  await page.goto('/spots');
  await expect(page.getByRole('link', { name: /경복궁/ })).toBeVisible();

  // 두 히스토리 엔트리 모두 복원할 수 있는 충분한 스크롤 영역을 만든다.
  await page.evaluate(`(() => {
    document.documentElement.style.minHeight = '3000px';
    window.scrollTo(0, 900);
  })()`);
  await expect.poll(() => page.evaluate('window.scrollY')).toBe(900);

  // Playwright의 자동 스크롤 없이 실제 링크 내비게이션만 발생시킨다.
  await page.getByRole('link', { name: /경복궁/ }).dispatchEvent('click');
  await expect(page).toHaveURL(/\/spots\/1$/);
  await expect.poll(() => page.evaluate('window.scrollY')).toBe(0);

  await page.evaluate('window.scrollTo(0, 500)');
  await expect.poll(() => page.evaluate('window.scrollY')).toBe(500);

  await page.goBack();
  await expect(page).toHaveURL(/\/spots$/);
  await expect.poll(() => page.evaluate('window.scrollY')).toBe(900);

  await page.goForward();
  await expect(page).toHaveURL(/\/spots\/1$/);
  await expect.poll(() => page.evaluate('window.scrollY')).toBe(500);
});
