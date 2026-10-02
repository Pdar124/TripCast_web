import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function RecommendationListSkeleton() {
  return (
    <div className="space-y-4" aria-label="추천 코스를 불러오는 중" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <Card
          className="grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6"
          key={index}
        >
          <Skeleton className="h-11 w-11 rounded-full" />
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
