import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { HomePage } from '@/features/home/home-page';

describe('HomePage', () => {
  it('서비스 이름과 핵심 안내 문구를 보여준다', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('오늘 떠나기 좋은 곳을 한눈에')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /여행지 둘러보기/ })).toHaveAttribute('href', '/spots');
  });
});
