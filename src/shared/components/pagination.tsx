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
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="페이지 이동">
      <Button
        aria-label="이전 페이지"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span className="min-w-20 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {currentPage + 1} / {totalPages}
      </span>
      <Button
        aria-label="다음 페이지"
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
