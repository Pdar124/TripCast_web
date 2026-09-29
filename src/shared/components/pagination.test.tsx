import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from '@/shared/components/pagination';

describe('Pagination', () => {
  it('0부터 시작하는 API page를 1부터 시작하는 화면 page로 표시한다', () => {
    const onPageChange = vi.fn();
    render(<Pagination onPageChange={onPageChange} page={0} totalPages={3} />);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
