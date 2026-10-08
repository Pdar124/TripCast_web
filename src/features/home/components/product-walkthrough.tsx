import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { useRef, useState } from 'react';

import { MobileWalkthroughPreview } from '@/features/home/components/mobile-walkthrough-preview';
import { narrativeStepForProgress } from '@/features/home/components/walkthrough-motion';
import { WalkthroughStage } from '@/features/home/components/walkthrough-stage';
import { walkthroughSteps } from '@/features/home/data/walkthrough-data';
import { cn } from '@/shared/lib/utils';

export function ProductWalkthrough() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const [activeStep, setActiveStep] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 360,
    damping: 54,
    mass: 0.18,
    restDelta: 0.001,
  });

  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const nextStep = narrativeStepForProgress(latest);
    setActiveStep((current) => (current === nextStep ? current : nextStep));
  });

  const useSequentialLayout = reducedMotion;

  return (
    <section
      className="relative scroll-mt-20 border-y border-border/60 bg-[linear-gradient(180deg,var(--background),var(--tc-surface),var(--background))]"
      id="walkthrough"
      ref={sectionRef}
    >
      <div className="container py-20 sm:py-24">
        <div className="mb-16 max-w-2xl lg:mb-24">
          <p className="tc-eyebrow">HOW TRIPCAST WORKS</p>
          <h2 className="mt-3 break-keep text-3xl font-bold tracking-tight sm:text-5xl">
            스크롤하며 미리 떠나보세요
          </h2>
          <p className="mt-5 break-keep text-base leading-7 text-muted-foreground sm:text-lg">
            검색부터 코스 추천까지, TripCast가 여행 날씨를 한 번에 정리하는 과정을 직접 체험해
            보세요.
          </p>
          <a
            className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-[var(--tc-accent-ink)] hover:underline"
            href="#live-recommendations"
          >
            설명 건너뛰고 실제 추천 보기
          </a>
        </div>

        <div
          className={cn(
            'grid gap-12',
            !useSequentialLayout &&
              'lg:grid-cols-[minmax(250px,0.7fr)_minmax(0,1.55fr)] lg:gap-12 xl:gap-20',
          )}
        >
          <ol className={cn('space-y-12', !useSequentialLayout && 'lg:space-y-0')}>
            {walkthroughSteps.map((step, index) => (
              <li
                aria-current={!useSequentialLayout && activeStep === index ? 'step' : undefined}
                className={cn(
                  'group',
                  !useSequentialLayout &&
                    'lg:flex lg:min-h-[100svh] lg:items-center lg:py-24 lg:transition-opacity',
                  !useSequentialLayout && activeStep !== index && 'lg:opacity-35',
                )}
                key={step.id}
              >
                <div className="w-full">
                  <p className="tc-eyebrow">{step.eyebrow}</p>
                  <h3 className="mt-3 break-keep text-2xl font-bold tracking-tight sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 break-keep text-sm leading-7 text-muted-foreground sm:text-base">
                    {step.description}
                  </p>
                  <motion.div
                    className={cn(
                      'mt-7 rounded-2xl border border-border bg-card p-4 shadow-sm lg:hidden',
                      useSequentialLayout && 'lg:block lg:max-w-2xl lg:p-6',
                    )}
                    initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                    transition={{ duration: 0.35 }}
                    viewport={{ amount: 0.25, once: false }}
                    whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  >
                    <MobileWalkthroughPreview step={step.id} />
                  </motion.div>
                </div>
              </li>
            ))}
          </ol>

          {!useSequentialLayout && (
            <div className="hidden lg:block">
              <div className="sticky top-20 h-[calc(100svh-6rem)] min-h-[620px] max-h-[820px] py-6">
                <WalkthroughStage progress={smoothProgress} reducedMotion={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
