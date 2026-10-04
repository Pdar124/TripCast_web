import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(page, 0), totalPages - 1);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="페이지 이동">
      <Button
        aria-label="이전 페이지"
        className="h-10 w-10 bg-card p-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      {Array.from({ length: totalPages }, (_, index) => (
        <Button
          aria-current={index === currentPage ? 'page' : undefined}
          className="h-10 min-w-10 bg-card px-3 text-muted-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
          key={index}
          onClick={() => onPageChange(index)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {index + 1}
        </Button>
      ))}
      <span className="sr-only" aria-live="polite">
        {currentPage + 1} / {totalPages}
      </span>
      <Button
        aria-label="다음 페이지"
        className="h-10 w-10 bg-card p-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
