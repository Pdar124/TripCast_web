import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const SIBLING_COUNT = 2;
const MAX_VISIBLE_ITEMS = SIBLING_COUNT * 2 + 5;

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

// 첫·마지막 페이지와 현재 페이지 주변만 남기고 나머지는 생략 표시로 줄인다.
// 어느 위치에서든 항목 수(MAX_VISIBLE_ITEMS)가 같도록 맞춰 이동 시 버튼이 흔들리지 않게 한다.
function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_VISIBLE_ITEMS) return range(0, totalPages - 1);

  const lastPage = totalPages - 1;
  const edgeCount = MAX_VISIBLE_ITEMS - 2;

  if (currentPage < edgeCount - SIBLING_COUNT) {
    return [...range(0, edgeCount - 1), 'ellipsis-end', lastPage];
  }
  if (currentPage > lastPage - (edgeCount - SIBLING_COUNT)) {
    return [0, 'ellipsis-start', ...range(lastPage - edgeCount + 1, lastPage)];
  }
  return [
    0,
    'ellipsis-start',
    ...range(currentPage - SIBLING_COUNT, currentPage + SIBLING_COUNT),
    'ellipsis-end',
    lastPage,
  ];
}

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
      {getPageItems(currentPage, totalPages).map((item) =>
        typeof item === 'number' ? (
          <Button
            aria-current={item === currentPage ? 'page' : undefined}
            className="h-10 min-w-10 bg-card px-3 text-muted-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
            key={item}
            onClick={() => onPageChange(item)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {item + 1}
          </Button>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 min-w-6 items-center justify-center text-muted-foreground"
            key={item}
          >
            …
          </span>
        ),
      )}
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
