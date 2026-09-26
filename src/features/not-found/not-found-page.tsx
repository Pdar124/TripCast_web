import { Link } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="text-4xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground">주소를 다시 확인하거나 홈으로 돌아가 주세요.</p>
      <Button asChild>
        <Link to="/">홈으로 돌아가기</Link>
      </Button>
    </main>
  );
}
