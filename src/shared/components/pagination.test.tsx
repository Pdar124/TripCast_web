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

  function pageLabels() {
    return Array.from(document.querySelectorAll('nav button:not([aria-label])')).map(
      (button) => button.textContent,
    );
  }

  it('페이지 수가 적으면 모든 번호를 표시한다', () => {
    render(<Pagination onPageChange={vi.fn()} page={0} totalPages={9} />);

    expect(pageLabels()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  it('페이지가 많으면 첫·마지막 페이지와 현재 페이지 주변만 표시한다', () => {
    render(<Pagination onPageChange={vi.fn()} page={37} totalPages={113} />);

    expect(pageLabels()).toEqual(['1', '36', '37', '38', '39', '40', '113']);
    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(screen.getByText('38', { selector: 'button' })).toHaveAttribute('aria-current', 'page');
  });

  it('앞쪽과 뒤쪽에서는 한쪽만 생략하고 표시 개수를 유지한다', () => {
    const { rerender } = render(<Pagination onPageChange={vi.fn()} page={1} totalPages={113} />);
    expect(pageLabels()).toEqual(['1', '2', '3', '4', '5', '6', '7', '113']);
    expect(screen.getAllByText('…')).toHaveLength(1);

    rerender(<Pagination onPageChange={vi.fn()} page={111} totalPages={113} />);
    expect(pageLabels()).toEqual(['1', '107', '108', '109', '110', '111', '112', '113']);
    expect(screen.getAllByText('…')).toHaveLength(1);
  });

  it('첫·마지막 페이지 번호로 바로 이동할 수 있다', () => {
    const onPageChange = vi.fn();
    render(<Pagination onPageChange={onPageChange} page={37} totalPages={113} />);

    fireEvent.click(screen.getByText('1', { selector: 'button' }));
    fireEvent.click(screen.getByText('113', { selector: 'button' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 0);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 112);
  });
});
