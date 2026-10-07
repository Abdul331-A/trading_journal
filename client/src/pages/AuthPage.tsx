import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const isLogin = mode === 'login';

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password);
      else await register(f.name, f.email, f.password);
      nav('/', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6 sm:p-8">
        <div className="mb-2">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-500 font-bold text-white">TJ</div>
          <h1 className="text-2xl font-bold">{isLogin ? 'Welcome back' : 'Create your journal'}</h1>
          <p className="text-sm text-ink-500">Log every trade and find your edge. Private to you.</p>
        </div>
        {!isLogin && <Field label="Name"><Input required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>}
        <Field label="Email"><Input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password" hint={isLogin ? undefined : 'At least 8 characters'}>
          <Input type="password" required minLength={isLogin ? 1 : 8} autoComplete={isLogin ? 'current-password' : 'new-password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </Field>
        <Button type="submit" loading={busy} className="w-full">{isLogin ? 'Log in' : 'Create account'}</Button>
        <p className="text-center text-sm text-ink-500">
          {isLogin ? 'New here? ' : 'Have an account? '}
          <Link to={isLogin ? '/register' : '/login'} className="font-medium text-brand-600">{isLogin ? 'Create one' : 'Log in'}</Link>
        </p>
      </form>
    </div>
  );
}
