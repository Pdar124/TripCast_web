import { expect, test } from '@playwright/test';

import {
  course,
  courseSummaries,
  courseWeather,
  excellentIndex,
  goodIndex,
  recommendations,
  spotWeather,
  spots,
} from './support/fixtures';
import { mockApi, pageOf } from './support/mock-api';

const viewports = [
  { name: '모바일', width: 375, height: 812 },
  { name: '태블릿', width: 768, height: 1024 },
  { name: '데스크톱', width: 1280, height: 800 },
] as const;

const routes = [
  { path: '/', ready: /여행 가기 좋은 날씨/ },
  { path: '/spots', ready: /전체 관광지/ },
  { path: '/spots?view=map', ready: /전체 관광지/ },
  { path: '/spots/1', ready: /경복궁/ },
  { path: '/courses', ready: /전체 관광코스/ },
  { path: '/courses/10', ready: /방문 순서와 날씨/ },
  { path: '/recommendations', ready: /추천 순위/ },
  { path: '/climate', ready: /최신 지수/ },
  { path: '/admin/login', ready: /관리자 로그인/ },
  { path: '/admin', ready: /관광기후지수 수동 동기화/, signedIn: true },
] as const;

test.beforeEach(async ({ page }) => {
  await mockApi(page, [
    { path: '/api/tour-spots', respond: () => ({ body: pageOf(spots) }) },
    { path: '/api/tour-spots/1/weather', respond: () => ({ body: spotWeather(1) }) },
    { path: '/api/tour-courses', respond: () => ({ body: pageOf(courseSummaries) }) },
    { path: '/api/tour-courses/10', respond: () => ({ body: course }) },
    { path: '/api/tour-courses/10/weather', respond: () => ({ body: courseWeather }) },
    { path: '/api/tour-courses/recommendations', respond: () => ({ body: recommendations }) },
    {
      path: /^\/api\/regions\/\d+\/climate-index$/,
      respond: () => ({ body: excellentIndex }),
    },
    {
      path: /^\/api\/regions\/\d+\/climate-index\/range$/,
      respond: () => ({
        body: [
          { ...goodIndex, date: '2026-09-22', score: 55 },
          { ...goodIndex, date: '2026-09-23', score: 82 },
        ],
      }),
    },
  ]);
});

for (const viewport of viewports) {
  test.describe(`${viewport.name} ${viewport.width}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routes) {
      test(`${route.path} 가로 스크롤이 생기지 않는다`, async ({ page }) => {
        if ('signedIn' in route) {
          await page.addInitScript(() => {
            localStorage.setItem(
              'tripcast.admin.session',
              JSON.stringify({ state: { token: 'e2e-token', username: 'e2e-admin' }, version: 0 }),
            );
          });
        }

        await page.goto(route.path);
        await expect(page.getByText(route.ready).first()).toBeVisible();

        // e2e는 DOM 타입 없이 컴파일되므로 문자열 식으로 평가한다.
        const overflow = await page.evaluate<number>(
          'document.documentElement.scrollWidth - document.documentElement.clientWidth',
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
}
