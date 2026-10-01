import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function SpotDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]" role="status">
      <div className="space-y-5">
        <Card className="space-y-4 p-6">
          <Skeleton className="h-9 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </Card>
        <Card className="space-y-5 p-6">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
      <Skeleton className="min-h-80 w-full lg:min-h-[34rem]" />
      <span className="sr-only">관광지 상세 정보를 불러오고 있습니다.</span>
    </div>
  );
}
