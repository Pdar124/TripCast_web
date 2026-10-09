import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function RecommendationListSkeleton() {
  return (
    <div className="space-y-4" aria-label="추천 코스를 불러오는 중" role="status">
      {Array.from({ length: 4 }, (_, index) => (
        <Card
          className="grid gap-4 p-4 sm:grid-cols-[56px_96px_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
          key={index}
        >
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="aspect-square w-24 rounded-md" />
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-4 w-2/5" />
          </div>
          <Skeleton className="h-4 w-20" />
        </Card>
      ))}
      <span className="sr-only">추천 코스를 불러오고 있습니다.</span>
    </div>
  );
}
