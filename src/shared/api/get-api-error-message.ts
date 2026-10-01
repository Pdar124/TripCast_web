import axios from 'axios';

const FALLBACK_MESSAGE = '요청을 처리하지 못했습니다. 다시 시도해 주세요.';

type ErrorResponse = {
  status?: unknown;
  message?: unknown;
};

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError<ErrorResponse>(error)) return FALLBACK_MESSAGE;

  const message = error.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : FALLBACK_MESSAGE;
}
