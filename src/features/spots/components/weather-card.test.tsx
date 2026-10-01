import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WeatherCard } from '@/features/spots/components/weather-card';

describe('WeatherCard', () => {
  it.each([null, undefined])('weather가 %s여도 상세 전체를 실패시키지 않는다', (weather) => {
    render(<WeatherCard weather={weather} />);

    expect(screen.getByText('날씨 정보를 불러오지 못했습니다')).toBeInTheDocument();
  });

  it('알 수 없는 sky는 기본 문구로 표시한다', () => {
    render(
      <WeatherCard
        weather={{
          forecastDate: '20260929',
          forecastTime: '1500',
          rainProbability: 20,
          sky: '새로운 하늘 상태',
          temperature: 22,
        }}
      />,
    );

    expect(screen.getByText('날씨 정보 없음')).toBeInTheDocument();
    expect(screen.getByText('2026.09.29 15:00 기준 · 기상청 단기예보')).toBeInTheDocument();
  });
});
