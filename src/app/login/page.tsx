'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
      } else {
        if (data.token) {
          localStorage.setItem('token', data.token);
          // Decode JWT to get user info
          const user = jwtDecode(data.token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        router.push('/');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 10px var(--shadow)', padding: '2rem', minWidth: 320, maxWidth: 360, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '2rem', letterSpacing: 1 }}>HÜNGY</h1>
          <div style={{ color: 'var(--dark-text)', fontWeight: 600, fontSize: '1.1rem', marginTop: 8 }}>Admin Login</div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #eee', fontSize: '1rem', marginBottom: 4 }}
            placeholder="admin@email.com"
            autoComplete="username"
            required
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #eee', fontSize: '1rem', marginBottom: 4 }}
            placeholder="Password"
            autoComplete="current-password"
            required
            disabled={loading}
          />
        </div>
        {error && <div style={{ color: 'var(--primary)', marginBottom: 12, fontSize: '0.95rem' }}>{error}</div>}
        <button type="submit" style={{ width: '100%', background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', borderRadius: 6, padding: '0.75rem', fontSize: '1rem', cursor: 'pointer', marginTop: 8 }} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
} 