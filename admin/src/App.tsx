import { useEffect, useState } from 'react';

import { StatusMessage } from './components/StatusMessage';
import { useAuth } from './lib/AuthProvider';
import { BooksPage } from './pages/BooksPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MembersPage } from './pages/MembersPage';

type RouteKey = 'dashboard' | 'members' | 'books';

const ROUTES: readonly { key: RouteKey; label: string }[] = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'members', label: '회원 관리' },
  { key: 'books', label: '도서 관리' },
];

function readRoute(): RouteKey {
  const hash = window.location.hash.replace('#/', '');
  return ROUTES.find((route) => route.key === hash)?.key ?? 'dashboard';
}

export function App() {
  const { status, email, signOut } = useAuth();
  const [route, setRoute] = useState<RouteKey>(readRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (status === 'loading') {
    return (
      <main className="login">
        <StatusMessage kind="loading">확인 중...</StatusMessage>
      </main>
    );
  }

  if (status === 'signedOut') {
    return <LoginPage />;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>북로그 관리자</h1>
        <nav aria-label="메뉴">
          {ROUTES.map((item) => (
            <a
              key={item.key}
              href={`#/${item.key}`}
              className={item.key === route ? 'nav-link active' : 'nav-link'}
              aria-current={item.key === route ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p className="muted">{email}</p>
          <button type="button" onClick={() => void signOut()}>
            로그아웃
          </button>
        </div>
      </aside>
      <main className="content">
        {route === 'dashboard' ? <DashboardPage /> : null}
        {route === 'members' ? <MembersPage /> : null}
        {route === 'books' ? <BooksPage /> : null}
      </main>
    </div>
  );
}
