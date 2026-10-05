import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/features/admin/store/auth-store';
import { cn } from '@/shared/lib/utils';

const navigation = [
  { label: '홈', to: '/' },
  { label: '관광지 검색', to: '/spots' },
  { label: '관광코스', to: '/courses' },
  { label: '추천 코스', to: '/recommendations' },
  { label: '관광기후지수', to: '/climate' },
] as const;

function BrandMark() {
  return (
    <svg className="h-7 w-7 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#1ed760" />
      <path
        d="M8 21c3.5-1.2 5.5-4 7-7.5S18.5 7 24 6.5"
        stroke="#000"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="21" r="2.6" fill="#000" />
      <circle cx="23.5" cy="7" r="2.6" fill="#000" />
    </svg>
  );
}

export function AppLayout() {
  const token = useAuthStore((state) => state.token);
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('tripcast.theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    try {
      localStorage.setItem('tripcast.theme', isDark ? 'dark' : 'light');
    } catch {
      // 저장소를 사용할 수 없어도 현재 세션의 테마는 유지한다.
    }
  }, [isDark]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="fixed left-4 top-[-60px] z-[100] rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-[top] focus:top-4"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>

      <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--tc-topbar)] backdrop-blur-2xl dark:border-white/10">
        <div className="container flex min-h-16 flex-wrap items-center gap-2 py-2 sm:gap-3 sm:py-0 lg:gap-6">
          <Link
            className="flex min-h-11 shrink-0 items-center gap-2"
            to="/"
            aria-label="TripCast 홈"
          >
            <BrandMark />
            <span className="text-lg font-bold tracking-[-0.2px]">TripCast</span>
          </Link>

          <nav
            className="order-3 -mx-1 flex basis-full items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] sm:order-none sm:mx-0 sm:basis-auto sm:flex-1 sm:pb-0 [&::-webkit-scrollbar]:hidden"
            aria-label="주요 메뉴"
          >
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    'inline-flex h-11 shrink-0 items-center rounded-full px-3 text-sm text-muted-foreground sm:h-9 lg:px-4 transition-colors hover:bg-secondary hover:text-foreground',
                    isActive && 'bg-secondary font-bold text-foreground',
                  )
                }
                end={item.to === '/'}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-[var(--tc-surface-hover)] sm:ml-0"
            onClick={() => setIsDark((current) => !current)}
            type="button"
          >
            {isDark ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <Link
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-black/15 sm:h-9 px-4 text-sm font-bold transition-colors hover:bg-secondary dark:border-white/15"
            aria-label={token ? '관리자 대시보드' : undefined}
            to={token ? '/admin' : '/admin/login'}
          >
            {token ? (
              <>
                관리자<span className="hidden lg:inline">&nbsp;대시보드</span>
              </>
            ) : (
              '관리자'
            )}
          </Link>
        </div>
      </header>

      <div className="flex-1" id="main-content">
        <Outlet />
      </div>

      <footer className="mt-16 border-t border-black/10 pb-12 pt-8 text-xs text-muted-foreground dark:border-white/10">
        <div className="container grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="max-w-3xl space-y-2">
            <p>
              <strong className="text-foreground">TripCast</strong> · 관광코스 날씨 통합 서비스
            </p>
            <p className="leading-5">
              기상청 단기예보와 관광기후지수를 코스 단위로 묶어 오늘 떠나기 좋은 여행길을
              안내합니다.
            </p>
          </div>
          <nav aria-label="전체 페이지">
            <p className="mb-3 font-bold text-foreground">전체 페이지</p>
            <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 md:grid-cols-1">
              {navigation.map((item) => (
                <li key={item.to}>
                  <Link
                    className="inline-block py-3 hover:text-foreground hover:underline md:py-1"
                    to={item.to}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  className="inline-block py-3 hover:text-foreground hover:underline md:py-1"
                  to="/admin/login"
                >
                  관리자 로그인
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
