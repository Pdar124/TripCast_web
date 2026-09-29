import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/shared/components/empty-state';

describe('EmptyState', () => {
  it('제목과 설명, 선택 action을 표시한다', () => {
    render(
      <EmptyState
        action={<button type="button">다시 시도</button>}
        description="잠시 후 다시 확인해 주세요."
        title="데이터가 없습니다"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('데이터가 없습니다');
    expect(screen.getByText('잠시 후 다시 확인해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });
});
