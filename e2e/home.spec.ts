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
  await expect(page.getByRole('heading', { level: 1, name: /어디로 떠날까/ })).toBeVisible();
  await expect(page.locator('#hero canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('hero-scene-placeholder')).toHaveCSS('opacity', '0', {
    timeout: 20_000,
  });
  await expect(page.getByRole('link', { name: /성산일출봉에서 시작하는 코스/ })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
