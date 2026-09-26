import { CloudSun, MapPinned } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';

export function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-6 py-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-sky-100 to-transparent" />
      <section className="mx-auto flex w-full max-w-5xl flex-col items-start gap-8">
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <CloudSun className="h-4 w-4 text-primary" aria-hidden="true" />
          날씨로 찾는 오늘의 여행
        </div>

        <div className="max-w-3xl space-y-5">
          <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
            오늘 떠나기 좋은 곳을 한눈에
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            TripCast가 관광지 날씨와 관광기후지수를 분석해 지금 가장 좋은 여행지를 알려드립니다.
          </p>
        </div>

        <Button size="lg">
          <MapPinned className="h-5 w-5" aria-hidden="true" />
          여행지 둘러보기
        </Button>
      </section>
    </main>
  );
}
