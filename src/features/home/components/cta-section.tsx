import { ArrowUp, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';

export function CTASection() {
  return (
    <section className="container pb-12 sm:pb-20">
      <div className="overflow-hidden rounded-2xl bg-foreground px-6 py-14 text-center text-background sm:px-10 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">READY TO GO</p>
        <h2 className="mt-4 break-keep text-3xl font-bold tracking-tight sm:text-5xl">
          오늘 어디로 떠나볼까요?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl break-keep text-sm leading-7 text-background/70 sm:text-base">
          관광지의 날씨부터 코스 전체의 쾌적도까지 확인하고 오늘 가장 좋은 여행을 골라보세요.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/recommendations">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> 오늘의 추천 코스 보기
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/spots">
              <Search className="h-4 w-4" aria-hidden="true" /> 관광지 검색
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a className="text-background hover:text-foreground" href="#walkthrough">
              <ArrowUp className="h-4 w-4" aria-hidden="true" /> 사용 흐름 다시 보기
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
