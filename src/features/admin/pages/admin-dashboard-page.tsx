import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useClimateIndexSync } from '@/features/admin/hooks/use-climate-index-sync';
import { useAuthStore } from '@/features/admin/store/auth-store';
import type { ClimateIndexSyncResult } from '@/features/admin/types';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { Button } from '@/shared/components/ui/button';

const statistics: Array<{ key: keyof ClimateIndexSyncResult; label: string }> = [
  { key: 'requestedRegions', label: '요청 지역' },
  { key: 'successfulRegions', label: '성공 지역' },
  { key: 'savedRecords', label: '저장 레코드' },
  { key: 'failedRegions', label: '실패 지역' },
];

export function AdminDashboardPage() {
  const username = useAuthStore((state) => state.username) ?? '관리자';
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const syncMutation = useClimateIndexSync();

  function logout() {
    clearSession();
    toast.success('로그아웃되었습니다.', {
      description: '다시 이용하려면 로그인해 주세요.',
    });
    navigate('/admin/login', { replace: true });
  }

  async function sync() {
    try {
      const result = await syncMutation.mutateAsync();
      toast.success('관광기후지수 동기화가 완료되었습니다.', {
        description: `${result.successfulRegions}개 지역에서 ${result.savedRecords}건을 저장했습니다.`,
      });
    } catch {
      // API 오류는 결과 영역에 표시하고, 401은 공통 인터셉터가 처리한다.
    }
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
              매일 새벽 배치를 기다리지 않고 최신 관광기후지수를 직접 수집합니다. 완료되면
              요청·성공·저장·실패 지역 수를 아래에서 확인할 수 있습니다.
            </p>
          </div>
          <Button
            className="h-12 shrink-0"
            disabled={syncMutation.isPending}
            onClick={sync}
            type="button"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {syncMutation.isPending ? '동기화 중' : '지금 동기화'}
          </Button>
        </div>

        <div className="mt-8 grid gap-4 border-t border-black/10 pt-8 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map(({ key, label }) => (
            <div className="rounded-lg bg-secondary p-5" key={key}>
              <p className="text-xs font-bold text-muted-foreground">{label}</p>
              <p
                className="mt-3 text-3xl font-bold"
                aria-label={syncMutation.data ? undefined : `${label} 집계 전`}
              >
                {syncMutation.data?.[key] ?? '—'}
              </p>
            </div>
          ))}
        </div>

        {syncMutation.isError ? (
          <div className="mt-6 rounded-md bg-destructive/10 p-5 text-center" role="alert">
            <p className="font-bold text-destructive">동기화에 실패했습니다</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {getApiErrorMessage(syncMutation.error)}
            </p>
            <Button className="mt-4" onClick={sync} size="sm" variant="outline">
              다시 시도
            </Button>
          </div>
        ) : syncMutation.data ? (
          <div className="mt-6 rounded-md border border-black/10 p-5 text-center dark:border-white/10">
            <p className="font-bold">동기화가 완료되었습니다</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              실패 지역 {syncMutation.data.failedRegions}곳을 포함한 최신 실행 결과입니다.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-dashed border-black/15 p-5 text-center dark:border-white/15">
            <p className="font-bold">아직 동기화 기록이 없습니다</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              &quot;지금 동기화&quot;를 눌러 최신 관광기후지수를 수집하세요.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
