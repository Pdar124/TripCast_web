import { expect, test } from '@playwright/test';

test('홈 화면을 표시한다', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('TripCast');
  await expect(page.getByRole('heading', { name: '오늘 떠나기 좋은 곳을 한눈에' })).toBeVisible();
});
