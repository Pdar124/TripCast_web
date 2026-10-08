import { Cloud, CloudSun, MapPin, Search, Sparkles, Sun } from 'lucide-react';
import { motion, type MotionValue, useTransform } from 'motion/react';

import { SCENE_RANGES } from '@/features/home/components/walkthrough-motion';
import {
  climateGrades,
  walkthroughData,
  type WalkthroughRecommendation,
  type WalkthroughSpot,
} from '@/features/home/data/walkthrough-data';
import { ClimateBadge } from '@/shared/components/climate-badge';
import { WeatherCard } from '@/shared/components/weather-card';

type WalkthroughStageProps = {
  progress: MotionValue<number>;
  reducedMotion: boolean;
};

function WeatherIcon({
  sky,
  className = 'h-4 w-4',
}: {
  sky: WalkthroughSpot['sky'];
  className?: string;
}) {
  const Icon = sky === '맑음' ? Sun : sky === '구름많음' ? CloudSun : Cloud;
  return <Icon className={className} aria-hidden="true" />;
}

function CourseNode({
  index,
  progress,
  spot,
}: {
  index: number;
  progress: MotionValue<number>;
  spot: WalkthroughSpot;
}) {
  const routeStart = SCENE_RANGES.course[0] + 0.05 + index * 0.055;
  const nodeOpacity = useTransform(progress, [routeStart, routeStart + 0.045], [0, 1]);
  const nodeScale = useTransform(progress, [routeStart, routeStart + 0.045], [0.4, 1]);
  const weatherStart = SCENE_RANGES.courseWeather[0] + index * 0.03;
  const weatherOpacity = useTransform(progress, [weatherStart, weatherStart + 0.055], [0, 1]);
  const weatherX = useTransform(progress, [weatherStart, weatherStart + 0.055], [-22, 0]);
  const positions = [
    { left: '9%', top: '11%' },
    { left: '37%', top: '25%' },
    { left: '63%', top: '53%' },
    { left: '82%', top: '76%' },
  ];

  return (
    <motion.div
      className="absolute z-20 flex items-center gap-2"
      style={{ ...positions[index], opacity: nodeOpacity, scale: nodeScale }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground shadow-lg ring-4 ring-primary/20">
        {index + 1}
      </span>
      <div className="rounded-lg border border-border/70 bg-background/95 px-3 py-2 shadow-md backdrop-blur">
        <p className="whitespace-nowrap text-xs font-bold">{spot.name}</p>
        <motion.p
          className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-muted-foreground"
          style={{ opacity: weatherOpacity, x: weatherX }}
        >
          <WeatherIcon sky={spot.sky} /> {spot.temperature}° · 강수 {spot.rainProbability}%
        </motion.p>
      </div>
    </motion.div>
  );
}

function RecommendationCard({
  course,
  index,
  progress,
}: {
  course: WalkthroughRecommendation;
  index: number;
  progress: MotionValue<number>;
}) {
  const enterStart = SCENE_RANGES.recommendation[0] + index * 0.025;
  const opacity = useTransform(progress, [enterStart, enterStart + 0.055], [0, 1]);
  const startY = [-112, 0, 112][index];
  const endX = [0, -185, 185][index];
  const endY = [-38, 118, 118][index];
  const x = useTransform(progress, [0.84, 0.97], [0, endX]);
  const y = useTransform(progress, [0.84, 0.97], [startY, endY]);
  const scale = useTransform(progress, [0.84, 0.97], [0.88, index === 0 ? 1.08 : 0.82]);

  return (
    <motion.article
      className="absolute left-1/2 top-1/2 ml-[-105px] mt-[-70px] w-[210px] rounded-xl border border-border bg-background p-4 shadow-lg"
      style={{ opacity, scale, x, y }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {index === 0 ? '오늘 추천' : `${index + 1}순위`}
        </span>
        {index === 0 && <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />}
      </div>
      <h3 className="mt-2 text-sm font-bold">{course.title}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">{course.description}</p>
      <div className="mt-3">
        <ClimateBadge climateIndex={{ grade: course.grade }} />
      </div>
    </motion.article>
  );
}

export function WalkthroughStage({ progress, reducedMotion }: WalkthroughStageProps) {
  const stageY = useTransform(progress, SCENE_RANGES.handoff, [56, 0]);
  const stageScale = useTransform(progress, SCENE_RANGES.handoff, [0.92, 1]);
  const keywordClip = useTransform(
    progress,
    [SCENE_RANGES.search[0], 0.15],
    ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
  );
  const resultsOpacity = useTransform(progress, [0.13, 0.21], [0, 1]);
  const resultsScaleY = useTransform(progress, [0.13, 0.23], [0.25, 1]);
  const searchOpacity = useTransform(progress, [0, 0.29, 0.39], [1, 1, 0]);
  const searchY = useTransform(progress, [0.27, 0.39], [0, -44]);

  const weatherOpacity = useTransform(progress, [0.24, 0.33, 0.48], [0, 1, 1]);
  const weatherClip = useTransform(
    progress,
    [0.24, 0.4],
    ['inset(66% 14% 20% 14% round 14px)', 'inset(0% 0% 0% 0% round 16px)'],
  );
  const weatherX = useTransform(progress, [0.39, 0.58], [0, -190]);
  const weatherY = useTransform(progress, [0.39, 0.58], [0, -112]);
  const weatherScale = useTransform(progress, [0.39, 0.58], [1, 0.58]);
  const weatherDim = useTransform(progress, [0.69, 0.81], [1, 0.2]);

  const courseOpacity = useTransform(progress, [0.38, 0.48, 0.73, 0.84], [0, 1, 1, 0.24]);
  const routeProgress = useTransform(progress, [0.42, 0.66], [0, 1]);
  const climateOpacity = useTransform(progress, [0.68, 0.76, 0.85, 0.9], [0, 1, 1, 0]);
  const climateScale = useTransform(progress, [0.69, 0.81], [0.72, 1.12]);
  const climateY = useTransform(progress, [0.69, 0.81], [72, 0]);
  const recommendationOpacity = useTransform(progress, [0.8, 0.88], [0, 1]);

  const finalStageStyle = reducedMotion ? undefined : { scale: stageScale, y: stageY };

  return (
    <motion.div
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden rounded-[24px] border border-black/10 bg-background shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:border-white/10"
      data-testid="walkthrough-stage"
      style={finalStageStyle}
    >
      <div className="flex h-14 items-center justify-between border-b border-border/70 bg-[var(--tc-topbar)] px-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 font-bold">
          <span className="h-3 w-3 rounded-full bg-primary" /> TripCast
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Interactive preview
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 top-14 overflow-hidden bg-[radial-gradient(circle_at_75%_20%,color-mix(in_srgb,var(--tc-accent)_12%,transparent),transparent_38%)]">
        <motion.div
          className="absolute inset-x-[9%] top-[11%] z-30"
          data-testid="search-preview"
          style={reducedMotion ? { opacity: 1 } : { opacity: searchOpacity, y: searchY }}
        >
          <div className="relative flex h-14 items-center rounded-2xl border border-border bg-background px-5 shadow-lg">
            <Search className="mr-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">어디로 떠나고 싶나요?</span>
            <motion.span
              className="absolute left-12 bg-background pr-1 text-sm font-bold text-foreground"
              style={reducedMotion ? undefined : { clipPath: keywordClip }}
            >
              {walkthroughData.destination}
            </motion.span>
            <span className="ml-auto rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
              검색
            </span>
          </div>
          <motion.div
            className="mt-3 origin-top overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-xl"
            style={reducedMotion ? undefined : { opacity: resultsOpacity, scaleY: resultsScaleY }}
          >
            {walkthroughData.spots.map((spot, index) => (
              <div
                className={
                  index === 0
                    ? 'flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold ring-1 ring-primary/30'
                    : 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground'
                }
                key={spot.id}
              >
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> {spot.name}
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute inset-x-[18%] top-[8%] z-20 rounded-2xl border border-border bg-card p-5 shadow-2xl"
          data-testid="weather-preview"
          style={
            reducedMotion
              ? { opacity: 0 }
              : {
                  clipPath: weatherClip,
                  opacity: weatherOpacity,
                  scale: weatherScale,
                  x: weatherX,
                  y: weatherY,
                }
          }
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="tc-eyebrow">SPOT WEATHER</p>
              <h3 className="mt-2 text-2xl font-bold">불국사</h3>
            </div>
            <ClimateBadge climateIndex={walkthroughData.climate} />
          </div>
          <motion.div style={reducedMotion ? undefined : { opacity: weatherDim }}>
            <WeatherCard
              weather={{
                forecastDate: '오늘',
                forecastTime: '1200',
                temperature: walkthroughData.spots[0].temperature,
                rainProbability: walkthroughData.spots[0].rainProbability,
                sky: walkthroughData.spots[0].sky,
              }}
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute inset-[7%] top-[9%] z-10"
          data-testid="course-preview"
          style={reducedMotion ? { opacity: 0 } : { opacity: courseOpacity }}
        >
          <p className="absolute right-2 top-0 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            경주 하루 코스 · 4곳
          </p>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 700 420">
            <path
              d="M62 72C165 24 225 114 292 122S405 166 445 220s104 116 192 108"
              fill="none"
              stroke="var(--tc-track)"
              strokeLinecap="round"
              strokeWidth="8"
            />
            <motion.path
              data-testid="route-path"
              d="M62 72C165 24 225 114 292 122S405 166 445 220s104 116 192 108"
              fill="none"
              stroke="var(--tc-accent)"
              strokeLinecap="round"
              strokeWidth="8"
              style={{ pathLength: routeProgress }}
            />
          </svg>
          {walkthroughData.spots.map((spot, index) => (
            <CourseNode index={index} key={spot.id} progress={progress} spot={spot} />
          ))}
        </motion.div>

        <motion.div
          className="absolute inset-0 z-40 grid place-items-center bg-background/75 px-8 backdrop-blur-[3px]"
          data-testid="climate-preview"
          style={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: climateOpacity, scale: climateScale, y: climateY }
          }
        >
          <div className="max-w-xl text-center">
            <p className="text-sm font-bold text-muted-foreground">
              그래서 오늘, 여행하기 좋은가요?
            </p>
            <div className="mt-4 flex justify-center">
              <ClimateBadge climateIndex={walkthroughData.climate} size="large" />
            </div>
            <p className="mt-4 text-lg font-bold">{walkthroughData.climate.description}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {climateGrades.map(({ grade }) => (
                <ClimateBadge climateIndex={{ grade }} key={grade} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 z-50 bg-card/95"
          data-testid="recommendation-preview"
          style={reducedMotion ? { opacity: 0 } : { opacity: recommendationOpacity }}
        >
          <div className="absolute inset-x-0 top-8 text-center">
            <p className="tc-eyebrow">TODAY'S PICKS</p>
            <h3 className="mt-2 text-xl font-bold">오늘 가기 좋은 순서로</h3>
          </div>
          {walkthroughData.recommendations.map((course, index) => (
            <RecommendationCard course={course} index={index} key={course.id} progress={progress} />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
