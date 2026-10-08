export const SCENE_RANGES = {
  handoff: [0, 0.08],
  search: [0.04, 0.28],
  weather: [0.24, 0.43],
  course: [0.39, 0.7],
  courseWeather: [0.6, 0.75],
  climate: [0.69, 0.85],
  recommendation: [0.81, 0.98],
} satisfies Record<string, [number, number]>;

export const NARRATIVE_THRESHOLDS = [0, 0.2, 0.39, 0.69, 0.83] as const;

export function narrativeStepForProgress(progress: number) {
  for (let index = NARRATIVE_THRESHOLDS.length - 1; index >= 0; index -= 1) {
    if (progress >= NARRATIVE_THRESHOLDS[index]) return index;
  }
  return 0;
}
