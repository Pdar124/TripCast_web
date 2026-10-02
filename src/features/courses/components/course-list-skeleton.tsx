import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function CourseListSkeleton() {
  return (
    <div
      className="grid gap-5 md:grid-cols-2"
      aria-label="관광코스 목록을 불러오는 중"
      role="status"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Card className="min-h-52 p-6" key={index}>
          <div className="flex justify-between gap-4">
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-6 w-3/5" />
          <Skeleton className="mt-3 h-4 w-2/5" />
          <Skeleton className="mt-8 h-4 w-28" />
        </Card>
      ))}
      <span className="sr-only">관광코스 목록을 불러오고 있습니다.</span>
    </div>
  );
}
