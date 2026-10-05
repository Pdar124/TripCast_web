import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClimateBadge } from '@/shared/components/climate-badge';

describe('ClimateBadge', () => {
  it('관광기후지수가 없으면 중립 상태를 표시한다', () => {
    render(<ClimateBadge climateIndex={null} />);

    expect(screen.getByText('지수 없음')).toBeInTheDocument();
  });

  it('알 수 없는 grade는 안전한 fallback으로 표시한다', () => {
    render(<ClimateBadge climateIndex={{ grade: 'NEW_GRADE', score: 77 }} />);

    expect(screen.getByText('지수 77')).toBeInTheDocument();
    expect(screen.getByText('정보 없음')).toBeInTheDocument();
    expect(screen.queryByText('NEW_GRADE')).not.toBeInTheDocument();
  });

  it('원문 소수 점수와 등급을 함께 표시한다', () => {
    render(<ClimateBadge climateIndex={{ grade: '좋음', score: 0.11 }} />);

    expect(screen.getByText('지수 0.11')).toBeInTheDocument();
    expect(screen.getByText('좋음')).toBeInTheDocument();
  });
});
