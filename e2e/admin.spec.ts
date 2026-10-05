import { expect, test } from '@playwright/test';

import { mockApi } from './support/mock-api';

// mock API에서만 유효한 테스트 값이다.
const testAdmin = { username: 'e2e-admin', password: 'e2e-password', token: 'e2e-token' };

test.beforeEach(async ({ page }) => {
  await mockApi(page, [
    {
      method: 'POST',
      path: '/api/auth/login',
      respond: ({ body }) => {
        const credentials = body as { username?: string; password?: string };
        return credentials.username === testAdmin.username &&
          credentials.password === testAdmin.password
          ? { body: { token: testAdmin.token, username: testAdmin.username } }
          : {
              status: 401,
              body: { status: 401, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
            };
      },
    },
    {
      method: 'POST',
      path: '/api/admin/climate-index/sync',
      respond: ({ authorization }) =>
        authorization === `Bearer ${testAdmin.token}`
          ? {
              body: {
                requestedRegions: 10,
                successfulRegions: 9,
                savedRecords: 126,
                failedRegions: 1,
              },
            }
          : { status: 401, body: { status: 401, message: '인증이 필요합니다.' } },
    },
  ]);
});

test('로그인하지 않고 /admin에 접근하면 로그인 페이지로 이동한다', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: '관리자 로그인' })).toBeVisible();
});

test('필수값 검증과 로그인 실패 메시지를 보여 준다', async ({ page }) => {
  await page.goto('/admin/login');

  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByText('아이디를 입력해 주세요.')).toBeVisible();
  await expect(page.getByText('비밀번호를 입력해 주세요.')).toBeVisible();

  await page.getByRole('textbox', { name: /아이디/ }).fill(testAdmin.username);
  await page.getByLabel(/비밀번호/).fill('wrong-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  await expect(page.getByRole('alert')).toHaveText('아이디 또는 비밀번호가 올바르지 않습니다.');
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('로그인 후 보호된 대시보드에서 동기화하고 로그아웃한다', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.getByRole('textbox', { name: /아이디/ }).fill(testAdmin.username);
  await page.getByLabel(/비밀번호/).fill(testAdmin.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  // 보호 라우트가 원래 가려던 /admin으로 되돌려 보낸다.
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { level: 1, name: testAdmin.username })).toBeVisible();

  await page.getByRole('button', { name: '지금 동기화' }).click();
  await expect(page.getByText('동기화가 완료되었습니다', { exact: true })).toBeVisible();
  await expect(page.getByText('126', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
});
