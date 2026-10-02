import { CloudSun } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { cn } from '@/shared/lib/utils';

const navigation = [
  { label: '홈', to: '/' },
  { label: '관광지 검색', to: '/spots' },
  { label: '관광코스', to: '/courses' },
] as const;

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="sr-only z-50 rounded-md bg-background px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <Link className="flex items-center gap-2 font-bold tracking-tight" to="/">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <CloudSun className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg">TripCast</span>
          </Link>
          <nav aria-label="주요 메뉴">
            <ul className="flex items-center gap-1">
              {navigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        'inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:px-4',
                        isActive && 'bg-accent text-accent-foreground',
                      )
                    }
                    end={item.to === '/'}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <div className="flex-1" id="main-content">
        <Outlet />
      </div>
      <footer className="border-t py-8">
        <div className="container text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">TripCast</p>
          <p className="mt-1">관광지 날씨와 관광기후지수로 완성하는 여행길</p>
        </div>
      </footer>
    </div>
  );
}
