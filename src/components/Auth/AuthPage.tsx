import { useState } from 'react';
import { useTheme } from '../../ThemeContext';

interface AuthPageProps {
  onSignIn:  (email: string, password: string) => Promise<{ message: string } | null>;
  onSignUp:  (email: string, password: string) => Promise<{ message: string } | null>;
}

export function AuthPage({ onSignIn, onSignUp }: Readonly<AuthPageProps>) {
  const { T } = useTheme();
  const [mode, setMode]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);

    const err = mode === 'login'
      ? await onSignIn(email, password)
      : await onSignUp(email, password);

    setBusy(false);

    if (err) {
      setError(err.message);
    } else if (mode === 'signup') {
      setInfo('Account created — check your email to confirm, then sign in.');
      setMode('login');
    }
    // If login succeeded, App will unmount this page automatically
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${T.glassBorder}`,
    borderRadius: 4,
    background: T.glassBg,
    color: T.textPrimary,
    fontSize: 14,
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>

      {/* Card */}
      <div className="glass" style={{
        width: '100%',
        maxWidth: 380,
        padding: '36px 32px',
        borderRadius: 4,
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48">
              <rect width="512" height="512" rx="96" fill="#0f1510"/>
              <g transform="translate(256,256) rotate(-45)">
                <rect x="-155" y="-27" width="235" height="54" rx="10" fill="#eee9de"/>
                <rect x="82" y="-20" width="90" height="40" rx="8" fill="#ddd8cc"/>
                <rect x="164" y="-14" width="60" height="28" rx="7" fill="#ccc8bc"/>
                <rect x="218" y="-10" width="18" height="20" rx="5" fill="#b8b4a8"/>
                <rect x="76" y="-29" width="14" height="58" rx="5" fill="#b4b0a4"/>
                <rect x="158" y="-22" width="12" height="44" rx="4" fill="#b4b0a4"/>
                <circle cx="-155" cy="0" r="42" fill="#0f1510"/>
                <circle cx="-155" cy="0" r="34" fill="#6a9e98" opacity="0.9"/>
                <circle cx="-155" cy="0" r="22" fill="#4a7c59" opacity="0.75"/>
                <circle cx="-144" cy="-12" r="9" fill="white" opacity="0.22"/>
                <circle cx="-155" cy="0" r="42" fill="none" stroke="#6B9B7F" strokeWidth="6"/>
              </g>
            </svg>
          </div>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 22,
            color: T.emerald,
            letterSpacing: '-0.3px',
            marginBottom: 4,
          }}>
            vigia
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </div>
        </div>

        {/* Error / Info */}
        {error && (
          <div style={{
            background: 'rgba(176,125,82,0.12)',
            border: `1px solid ${T.amber}`,
            color: T.amber,
            borderRadius: 4,
            padding: '8px 12px',
            fontSize: 12,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{
            background: T.checkedCellBg,
            border: `1px solid ${T.glassBorderEm}`,
            color: T.emerald,
            borderRadius: 4,
            padding: '8px 12px',
            fontSize: 12,
            marginBottom: 16,
          }}>
            {info}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '11px',
              background: busy ? T.sage : T.emerald,
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              cursor: busy ? 'wait' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: T.textMuted }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
            style={{
              background: 'none', border: 'none',
              color: T.emerald, cursor: 'pointer',
              fontWeight: 600, fontSize: 12,
              padding: 0, fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
