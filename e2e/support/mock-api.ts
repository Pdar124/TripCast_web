import type { Page } from '@playwright/test';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

type MockResult = { status?: number; body?: unknown };

export type MockRoute = {
  method?: 'GET' | 'POST';
  path: string | RegExp;
  respond: (request: { url: URL; body: unknown; authorization: string | undefined }) => MockResult;
};

/** `/api/**` 요청을 가로채 mock 응답을 돌려준다. 등록되지 않은 API는 404로 응답한다. */
export async function mockApi(page: Page, routes: MockRoute[]) {
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const request = route.request();

      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }

      const url = new URL(request.url());
      const matched = routes.find(
        (candidate) =>
          (candidate.method ?? 'GET') === request.method() &&
          (typeof candidate.path === 'string'
            ? candidate.path === url.pathname
            : candidate.path.test(url.pathname)),
      );

      if (!matched) {
        await route.fulfill({
          status: 404,
          headers: corsHeaders,
          json: {
            status: 404,
            message: `mock이 없는 API입니다: ${request.method()} ${url.pathname}`,
          },
        });
        return;
      }

      const { status = 200, body } = matched.respond({
        url,
        body: request.postDataJSON() as unknown,
        authorization: request.headers()['authorization'],
      });
      await route.fulfill({ status, headers: corsHeaders, json: body ?? {} });
    },
  );
}

export function pageOf<T>(content: T[], page = 0, size = 20, totalPages = 1) {
  return {
    content,
    number: page,
    size,
    totalElements: content.length,
    totalPages,
  };
}
