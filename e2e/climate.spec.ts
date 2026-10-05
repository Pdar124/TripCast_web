import { expect, test } from '@playwright/test';

import { mockApi } from './support/mock-api';

function series(regionId: string) {
  return [
    { regionId, date: '2026-09-21', score: 61, grade: '보통' },
    { regionId, date: '2026-09-22', score: 74, grade: '좋음' },
    { regionId, date: '2026-09-23', score: 91, grade: '매우좋음' },
  ];
}

test('지역별 최신 지수와 기간 추이를 보여 준다', async ({ page }) => {
  await mockApi(page, [
    {
      path: /^\/api\/regions\/\d+\/climate-index$/,
      respond: ({ url }) => {
        const regionId = url.pathname.split('/')[3];
        return regionId === '9999900000'
          ? { status: 404, body: { status: 404, message: '관광기후지수를 찾을 수 없습니다.' } }
          : { body: series(regionId).at(-1) };
      },
    },
    {
      path: /^\/api\/regions\/\d+\/climate-index\/range$/,
      respond: ({ url }) => ({ body: series(url.pathname.split('/')[3]) }),
    },
  ]);

  await page.goto('/climate');

  await expect(page.getByRole('heading', { level: 1, name: '관광기후지수' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '시군구 코드 5013000000' })).toBeVisible();
  await expect(page.getByText('지수 91', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: '기간별 관광기후지수 추이 그래프' })).toBeVisible();

  await page.getByRole('button', { name: '해운대구' }).click();
  await expect(page).toHaveURL(/region=2635000000/);
  await expect(page.getByRole('heading', { name: '시군구 코드 2635000000' })).toBeVisible();

  await page.getByRole('combobox', { name: '시군구 코드' }).fill('9999900000');
  await page.getByRole('button', { name: '조회', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '해당 지역의 관광기후지수가 없습니다' }),
  ).toBeVisible();
});
