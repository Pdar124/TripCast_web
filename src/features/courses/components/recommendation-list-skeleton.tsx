import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function RecommendationListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-label="추천 코스를 불러오는 중" role="status">
      {Array.from({ length: 4 }, (_, index) => (
        <Card className="overflow-hidden" key={index}>
          <div className="relative">
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
            <Skeleton className="absolute left-4 top-4 h-12 w-12 rounded-full" />
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-4 w-2/5" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-5" />
            </div>
          </div>
        </Card>
      ))}
      <span className="sr-only">추천 코스를 불러오고 있습니다.</span>
    </div>
  );
}
