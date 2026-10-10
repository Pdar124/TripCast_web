import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Outlet, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollManager } from '@/shared/components/scroll-manager';

let currentScrollX = 0;
let currentScrollY = 0;
let documentHeight = 3_000;

class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = [];

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this);
  }

  disconnect() {}

  observe() {}

  takeRecords() {
    return [];
  }

  unobserve() {}

  resize() {
    this.callback([], this);
  }
}

function TestLayout() {
  return (
    <>
      <ScrollManager />
      <nav>
        <Link to="/list">목록</Link>
        <Link to="/detail">상세</Link>
      </nav>
      <Outlet />
    </>
  );
}

function createTestRouter() {
  return createMemoryRouter(
    [
      {
        element: <TestLayout />,
        children: [
          { path: '/list', element: <div>목록 페이지</div> },
          { path: '/detail', element: <div>상세 페이지</div> },
        ],
      },
    ],
    { initialEntries: ['/list'] },
  );
}

function setScrollPosition(y: number) {
  currentScrollY = y;
  fireEvent.scroll(window);
}

describe('ScrollManager', () => {
  beforeEach(() => {
    currentScrollX = 0;
    currentScrollY = 0;
    documentHeight = 3_000;
    ResizeObserverMock.instances = [];
    sessionStorage.clear();

    Object.defineProperties(window, {
      scrollX: { configurable: true, get: () => currentScrollX },
      scrollY: { configurable: true, get: () => currentScrollY },
    });
    Object.defineProperties(document.documentElement, {
      scrollHeight: { configurable: true, get: () => documentHeight },
      offsetHeight: { configurable: true, get: () => documentHeight },
    });
    Object.defineProperties(document.body, {
      scrollHeight: { configurable: true, get: () => documentHeight },
      offsetHeight: { configurable: true, get: () => documentHeight },
    });

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.spyOn(window, 'scrollTo').mockImplementation(((x: number, y: number) => {
      currentScrollX = x;
      currentScrollY = y;
    }) as typeof window.scrollTo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('PUSH에서는 맨 위로 이동하고 POP 뒤로/앞으로에서는 각 위치를 복원한다', async () => {
    const user = userEvent.setup();
    const router = createTestRouter();
    render(<RouterProvider router={router} />);

    setScrollPosition(420);
    await user.click(screen.getByRole('link', { name: '상세' }));
    expect(await screen.findByText('상세 페이지')).toBeInTheDocument();
    expect(currentScrollY).toBe(0);

    setScrollPosition(180);
    await act(() => router.navigate(-1));
    await waitFor(() => expect(screen.getByText('목록 페이지')).toBeInTheDocument());
    expect(currentScrollY).toBe(420);

    await act(() => router.navigate(1));
    await waitFor(() => expect(screen.getByText('상세 페이지')).toBeInTheDocument());
    expect(currentScrollY).toBe(180);
  });

  it('비동기 콘텐츠로 문서가 길어지면 잘렸던 POP 위치를 다시 복원한다', async () => {
    const user = userEvent.setup();
    const router = createTestRouter();
    render(<RouterProvider router={router} />);

    setScrollPosition(1_200);
    await user.click(screen.getByRole('link', { name: '상세' }));
    expect(await screen.findByText('상세 페이지')).toBeInTheDocument();

    documentHeight = 900;
    await act(() => router.navigate(-1));
    await waitFor(() => expect(screen.getByText('목록 페이지')).toBeInTheDocument());
    expect(currentScrollY).toBe(132);

    documentHeight = 3_000;
    act(() => ResizeObserverMock.instances.at(-1)?.resize());
    expect(currentScrollY).toBe(1_200);
  });
});
