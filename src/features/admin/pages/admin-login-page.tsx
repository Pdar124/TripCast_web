import { LoaderCircle, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { useLogin } from '@/features/admin/hooks/use-login';
import { useAuthStore } from '@/features/admin/store/auth-store';
import type { LoginCredentials } from '@/features/admin/types';
import { getApiErrorMessage } from '@/shared/api/get-api-error-message';
import { Button } from '@/shared/components/ui/button';

const loginSchema = z.object({
  username: z.string().trim().min(1, '아이디를 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

type LoginLocationState = {
  from?: string;
};

export function AdminLoginPage() {
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: { username: '', password: '' },
  });

  if (token) {
    return <Navigate replace to="/admin" />;
  }

  async function submit(values: LoginCredentials) {
    setFormError(null);
    const result = loginSchema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'username' || field === 'password') {
          setError(field, { message: issue.message });
        }
      });
      return;
    }

    try {
      const session = await loginMutation.mutateAsync(result.data);
      setSession(session);
      toast.success('로그인되었습니다.', {
        description: `${session.username}님, 환영합니다.`,
      });
      const destination = (location.state as LoginLocationState | null)?.from ?? '/admin';
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  }

  const inputClassName =
    'h-12 rounded-md border border-transparent bg-secondary px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive';

  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-5 py-12">
      <form
        className="grid w-full max-w-[400px] gap-5 rounded-lg bg-card p-6 shadow-[var(--tc-shadow-raised)] sm:p-8"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        </span>

        <div>
          <p className="tc-eyebrow">ADMIN CONSOLE</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">관리자 로그인</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            관광기후지수 운영 콘솔에 접속합니다.
          </p>
        </div>

        <label className="grid gap-2 text-xs font-bold" htmlFor="username">
          아이디 <span className="sr-only">필수</span>
          <input
            {...register('username')}
            aria-describedby={errors.username ? 'username-error' : undefined}
            aria-invalid={Boolean(errors.username)}
            autoComplete="username"
            className={inputClassName}
            id="username"
          />
          {errors.username && (
            <span className="text-xs font-medium text-destructive" id="username-error">
              {errors.username.message}
            </span>
          )}
        </label>

        <label className="grid gap-2 text-xs font-bold" htmlFor="password">
          비밀번호 <span className="sr-only">필수</span>
          <input
            {...register('password')}
            aria-describedby={errors.password ? 'password-error' : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            className={inputClassName}
            id="password"
            type="password"
          />
          {errors.password && (
            <span className="text-xs font-medium text-destructive" id="password-error">
              {errors.password.message}
            </span>
          )}
        </label>

        {formError && (
          <p
            className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {formError}
          </p>
        )}

        <Button className="h-12" disabled={loginMutation.isPending} type="submit">
          {loginMutation.isPending && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {loginMutation.isPending ? '로그인 중' : '로그인'}
        </Button>

        <p className="rounded-md bg-secondary px-4 py-3 text-xs leading-5 text-muted-foreground">
          관리자 계정은 백엔드 운영 환경에서 관리됩니다. 계정 정보는 브라우저나 저장소에 포함하지
          않습니다.
        </p>
      </form>
    </main>
  );
}
