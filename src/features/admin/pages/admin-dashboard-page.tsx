import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/features/admin/store/auth-store';
import { Button } from '@/shared/components/ui/button';

export function AdminDashboardPage() {
  const username = useAuthStore((state) => state.username) ?? '관리자';
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  function logout() {
    clearSession();
    toast.success('로그아웃되었습니다.', {
      description: '다시 이용하려면 로그인해 주세요.',
    });
    navigate('/admin/login', { replace: true });
  }

  return (
    <main className="tc-page">
      <header className="tc-page-head">
        <div className="flex flex-col justify-between gap-5 rounded-lg bg-card p-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
              {username.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold">{username}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">관광기후지수 운영 콘솔</p>
            </div>
          </div>
          <Button className="self-start sm:self-auto" onClick={logout} size="sm" variant="outline">
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            로그아웃
          </Button>
        </div>
      </header>

      <section className="rounded-lg bg-card p-6 sm:p-8" aria-labelledby="climate-sync-title">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="max-w-2xl">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-primary/15 text-[var(--tc-accent-ink)]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="tc-eyebrow mt-5">CLIMATE DATA</p>
            <h2 className="mt-2 text-2xl font-bold" id="climate-sync-title">
              관광기후지수 수동 동기화
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              현재 운영 OpenAPI에는 수동 동기화 API가 공개되어 있지 않습니다. 백엔드에서 관리자
              동기화 기능을 활성화하면 요청·성공·저장·실패 지역 수를 이 화면에 표시할 예정입니다.
            </p>
          </div>
          <Button className="h-12 shrink-0" disabled type="button">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            지금 동기화
          </Button>
        </div>

        <div className="mt-8 grid gap-4 border-t border-black/10 pt-8 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {['요청 지역', '성공 지역', '저장 레코드', '실패 지역'].map((label) => (
            <div className="rounded-lg bg-secondary p-5" key={label}>
              <p className="text-xs font-bold text-muted-foreground">{label}</p>
              <p className="mt-3 text-3xl font-bold" aria-label={`${label} 집계 전`}>
                —
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-md border border-dashed border-black/15 p-5 text-center dark:border-white/15">
          <p className="font-bold">아직 동기화 기록이 없습니다</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            백엔드 API가 활성화되면 최신 관광기후지수를 여기서 직접 수집할 수 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
