import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from '@/shared/api/get-api-error-message';

describe('getApiErrorMessage', () => {
  it('ErrorResponse.message를 우선 반환한다', () => {
    const error = {
      isAxiosError: true,
      response: { data: { status: 404, message: '관광지를 찾을 수 없습니다.' } },
    };

    expect(getApiErrorMessage(error)).toBe('관광지를 찾을 수 없습니다.');
  });

  it('서버 message가 없으면 공통 문구를 반환한다', () => {
    expect(getApiErrorMessage(new Error('network error'))).toBe(
      '요청을 처리하지 못했습니다. 다시 시도해 주세요.',
    );
  });
});
