/**
 * 무거운 작업(로드뷰·지도 인스턴스 생성)을 동시에 최대 `max`개까지만 시작하게 하는 대기열.
 * `run`에 넘긴 `start`는 자리가 나면 호출되고, 작업이 끝나면 `done`을 반드시 호출해야 다음 작업이 시작된다.
 * 반환값은 취소 함수로, 대기 중이면 대기열에서 빼고 실행 중이면 자리를 반납한다.
 */
export function createLoadLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  function drain() {
    while (active < max && queue.length > 0) {
      active += 1;
      queue.shift()?.();
    }
  }

  function run(start: (done: () => void) => void) {
    let state: 'queued' | 'running' | 'finished' = 'queued';

    const done = () => {
      if (state !== 'running') return;
      state = 'finished';
      active -= 1;
      drain();
    };
    const job = () => {
      state = 'running';
      start(done);
    };

    queue.push(job);
    drain();

    return () => {
      if (state === 'queued') {
        queue.splice(queue.indexOf(job), 1);
        state = 'finished';
      } else {
        done();
      }
    };
  }

  return { run };
}
