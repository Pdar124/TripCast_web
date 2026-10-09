import { describe, expect, it, vi } from 'vitest';

import { createLoadLimiter } from '@/shared/lib/load-limiter';

describe('createLoadLimiter', () => {
  it('최대 개수까지만 동시에 시작하고 done을 부르면 다음 작업을 시작한다', () => {
    const limiter = createLoadLimiter(2);
    const done: (() => void)[] = [];
    const starts = [vi.fn(), vi.fn(), vi.fn()].map((start) =>
      start.mockImplementation((finish: () => void) => done.push(finish)),
    );

    starts.forEach((start) => limiter.run(start));

    expect(starts.map((start) => start.mock.calls.length)).toEqual([1, 1, 0]);

    done[0]();

    expect(starts[2]).toHaveBeenCalledTimes(1);
  });

  it('done을 여러 번 불러도 자리는 한 번만 반납한다', () => {
    const limiter = createLoadLimiter(1);
    let first: () => void = () => {};
    const second = vi.fn();
    const third = vi.fn();

    limiter.run((done) => {
      first = done;
    });
    limiter.run(second);
    limiter.run(third);

    first();
    first();

    expect(second).toHaveBeenCalledTimes(1);
    expect(third).not.toHaveBeenCalled();
  });

  it('대기 중에 취소하면 시작하지 않고, 실행 중에 취소하면 자리를 반납한다', () => {
    const limiter = createLoadLimiter(1);
    const first = vi.fn();
    const queued = vi.fn();
    const last = vi.fn();

    const cancelFirst = limiter.run(first);
    const cancelQueued = limiter.run(queued);
    limiter.run(last);

    cancelQueued();
    expect(queued).not.toHaveBeenCalled();

    cancelFirst();
    expect(last).toHaveBeenCalledTimes(1);
    expect(queued).not.toHaveBeenCalled();
  });
});
