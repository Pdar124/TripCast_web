import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProtectedAdminRoute } from '@/features/admin/components/protected-admin-route';
import { useAuthStore } from '@/features/admin/store/auth-store';

function renderRoutes() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<p>로그인 화면</p>} path="/admin/login" />
        <Route
          element={
            <ProtectedAdminRoute>
              <p>보호된 관리자 화면</p>
            </ProtectedAdminRoute>
          }
          path="/admin"
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedAdminRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clearSession();
  });

  it('토큰이 없으면 로그인 화면으로 이동한다', async () => {
    renderRoutes();

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument();
  });

  it('토큰이 있으면 보호된 관리자 화면을 표시한다', async () => {
    useAuthStore.getState().setSession({ token: 'test-token', username: 'admin' });
    renderRoutes();

    expect(await screen.findByText('보호된 관리자 화면')).toBeInTheDocument();
  });
});
