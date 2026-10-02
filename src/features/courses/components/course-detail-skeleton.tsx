import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function CourseDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]" role="status">
      <div className="space-y-5">
        <Card className="space-y-4 p-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-3/5" />
          <Skeleton className="h-4 w-2/5" />
        </Card>
        {Array.from({ length: 3 }, (_, index) => (
          <Card className="ml-12 space-y-5 p-6" key={index}>
            <Skeleton className="h-6 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-40 w-full" />
          </Card>
        ))}
      </div>
      <Skeleton className="min-h-80 w-full lg:min-h-[34rem]" />
      <span className="sr-only">관광코스 상세 정보를 불러오고 있습니다.</span>
    </div>
  );
}
