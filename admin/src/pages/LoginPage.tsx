import { useState, type FormEvent } from 'react';

import { useAuth } from '../lib/AuthProvider';
import { supabaseConfigError } from '../lib/supabase';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      setErrorMessage(await signIn(email.trim(), password));
    } catch {
      setErrorMessage('로그인 중 문제가 생겼습니다. 네트워크를 확인하고 다시 시도하세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>북로그 관리자</h1>
        <p className="muted">관리자 계정으로만 로그인할 수 있습니다.</p>

        {supabaseConfigError ? (
          <p className="status status-error" role="alert">
            {supabaseConfigError}
          </p>
        ) : null}

        <label>
          이메일
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {errorMessage ? (
          <p className="status status-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button type="submit" className="primary" disabled={isSubmitting || supabaseConfigError !== null}>
          {isSubmitting ? '확인 중...' : '로그인'}
        </button>
      </form>
    </main>
  );
}
