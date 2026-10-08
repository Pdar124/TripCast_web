import { ArrowDown, ArrowRight, Compass, Search } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { type FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HeroBackground } from '@/features/home/components/hero-background';
import { Button } from '@/shared/components/ui/button';

export function HeroSection() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [keyword, setKeyword] = useState('');
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const copyOpacity = useTransform(scrollYProgress, [0, 0.62, 0.92], [1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const searchOpacity = useTransform(scrollYProgress, [0, 0.74, 1], [1, 1, 0]);
  const searchScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const searchY = useTransform(scrollYProgress, [0, 1], [0, 70]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextKeyword = keyword.trim();
    navigate(nextKeyword ? `/spots?keyword=${encodeURIComponent(nextKeyword)}` : '/spots');
  }

  return (
    <section
      className="tc-hero relative h-[calc(100svh-4rem)] min-h-[640px] overflow-hidden bg-[var(--hero-bg)]"
      id="hero"
      ref={sectionRef}
    >
      <HeroBackground />
      <div className="absolute inset-0 z-[1] bg-[var(--tc-hero-scrim)]" aria-hidden="true" />
      <div className="container relative z-10 flex h-full max-w-[780px] flex-col justify-center text-[var(--tc-hero-foreground)]">
        <motion.div style={reducedMotion ? undefined : { opacity: copyOpacity, y: copyY }}>
          <p className="tc-eyebrow text-[var(--tc-hero-muted)]">관광코스 날씨 통합 서비스</p>
          <h1 className="mt-4 break-keep text-[48px] font-bold leading-[1.02] tracking-[-1.5px] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)] sm:text-[64px]">
            여행 가기 좋은 날씨,
            <br />
            <span className="whitespace-nowrap">이제 코스까지 한 번에.</span>
          </h1>
          <p className="mt-5 max-w-[38em] break-keep text-lg leading-8 text-[var(--tc-hero-muted)] sm:text-xl">
            관광지 날씨와 관광기후지수, 오늘 가기 좋은 여행 코스를 하나의 흐름으로 만나보세요.
          </p>
        </motion.div>

        <motion.div
          className="mt-8 max-w-2xl"
          style={
            reducedMotion ? undefined : { opacity: searchOpacity, scale: searchScale, y: searchY }
          }
        >
          <form
            className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 text-foreground shadow-2xl backdrop-blur-xl sm:flex-row"
            onSubmit={submit}
            role="search"
          >
            <label className="relative flex-1">
              <span className="sr-only">관광지 검색어</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                className="h-12 w-full rounded-xl bg-secondary py-2 pl-12 pr-4 text-sm font-semibold placeholder:text-muted-foreground"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="어디로 떠나고 싶나요?"
                type="search"
                value={keyword}
              />
            </label>
            <Button className="h-12 px-7" type="submit">
              여행지 찾기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <a
              className="inline-flex min-h-11 items-center gap-2 text-white hover:underline"
              href="#walkthrough"
            >
              사용 흐름 보기 <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              className="inline-flex min-h-11 items-center text-[var(--tc-hero-muted)] hover:text-white hover:underline"
              href="#live-recommendations"
            >
              설명 건너뛰고 TripCast 시작하기
            </a>
          </div>
        </motion.div>
      </div>

      <p className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap text-xs uppercase tracking-[0.09em] text-[var(--tc-hero-muted)] sm:flex">
        <Compass className="h-4 w-4" aria-hidden="true" /> 스크롤해서 체험하기
      </p>
    </section>
  );
}
