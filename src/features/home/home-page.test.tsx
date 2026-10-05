import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { HomePage } from '@/features/home/home-page';

describe('HomePage', () => {
  it('서비스 이름과 핵심 안내 문구를 보여준다', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const heroTitle = screen.getByText(/어디로 떠날까/);
    expect(heroTitle).toBeInTheDocument();
    expect(heroTitle.closest('h1')).toHaveClass(
      '[text-shadow:0_2px_24px_rgba(0,0,0,0.45)]',
    );
    expect(screen.getAllByRole('link', { name: /관광지 검색/ })[0]).toHaveAttribute(
      'href',
      '/spots',
    );
    expect(document.querySelector('img[src="/assets/img/hero-terrain.jpg"]')).toBeInTheDocument();
  });
});
