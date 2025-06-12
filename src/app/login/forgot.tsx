import React, { useState } from 'react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Network error');
      const users = await res.json();
      if (!Array.isArray(users) || users.length === 0) {
        setError('No user found with that email address.');
        setLoading(false);
        return;
      }
      setUserId(users[0].id);
      setStep('reset');
    } catch (err) {
      setError('Failed to check email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!userId) {
      setError('User not found.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update password');
      }
      setSuccess('Password updated successfully! You can now log in.');
      setStep('email');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={step === 'email' ? handleEmailSubmit : handleResetSubmit} style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 10px var(--shadow)', padding: '2rem', minWidth: 320, maxWidth: 360, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '2rem', letterSpacing: 1 }}>Forgot Password</h1>
        </div>
        {step === 'email' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #eee', fontSize: '1rem', marginBottom: 4 }}
                placeholder="Enter your email"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#ff9800] hover:bg-[#ff9800] text-white font-semibold rounded-lg py-3 text-lg mt-2 transition focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !email}
            >
              {loading ? 'Checking...' : 'Next'}
            </button>
          </>
        )}
        {step === 'reset' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="password" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #eee', fontSize: '1rem', marginBottom: 4 }}
                placeholder="New password"
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #eee', fontSize: '1rem', marginBottom: 4, borderColor: confirmPassword && password !== confirmPassword ? '#e53935' : '#eee' }}
                placeholder="Confirm password"
                autoComplete="new-password"
                required
                disabled={loading}
              />
              {confirmPassword && password !== confirmPassword && (
                <div style={{ color: '#e53935', fontSize: 13, marginTop: 2 }}>Passwords do not match</div>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-[#ff9800] hover:bg-[#ff9800] text-white font-semibold rounded-lg py-3 text-lg mt-2 transition focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </>
        )}
        {error && <div style={{ color: '#e53935', marginTop: 12, fontSize: '0.95rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: '#1db96b', marginTop: 12, fontSize: '0.95rem', textAlign: 'center' }}>{success}</div>}
      </form>
    </div>
  );
} 