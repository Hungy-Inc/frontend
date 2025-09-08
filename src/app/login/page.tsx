'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Head from 'next/head';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMessage = data.error || 'Invalid credentials';
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        if (data.token) {
          localStorage.setItem('token', data.token);
          // Store remember me preference
          localStorage.setItem('rememberMe', rememberMe.toString());
          // Decode JWT to get user info
          const user = jwtDecode(data.token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Show success message with expiration info
          const expirationText = rememberMe ? '30 days' : '7 days';
          toast.success(`Login successful! Session expires in ${expirationText}. Redirecting...`);
        }
        // Small delay to ensure token is stored and show success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 50);
      }
    } catch (err) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - HÜNGY Admin</title>
        <meta name="description" content="HÜNGY Admin Login" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form 
        onSubmit={handleSubmit} 
        method="POST"
        action="/login"
        data-testid="login-form"
        style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 10px var(--shadow)', padding: '2rem', minWidth: 320, maxWidth: 360, width: '100%' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '2rem', letterSpacing: 1 }}>HÜNGY</h1>
          <div className="text-dark-text" style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: 8 }}>Admin Login</div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Email</label>
          <input
            id="email"
            name="email"
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
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                paddingRight: '3rem',
                borderRadius: 6, 
                border: '1px solid #eee', 
                fontSize: '1rem', 
                marginBottom: 4 
              }}
              placeholder="Password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff9800';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#666';
              }}
              disabled={loading}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>
        </div>
        
        {/* Hidden input for password managers */}
        <input type="hidden" name="rememberMe" value={rememberMe.toString()} />
        
        {/* Remember Me checkbox */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMeCheckbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              accentColor: '#ff9800',
              cursor: 'pointer'
            }}
            disabled={loading}
          />
          <label 
            htmlFor="rememberMe" 
            style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            Remember me for 30 days
          </label>
        </div>
        
        {error && <div style={{ color: 'var(--primary)', marginBottom: 12, fontSize: '0.95rem' }}>{error}</div>}
        <button
          type="submit"
          className="w-full bg-[#ff9800] hover:bg-[#ff9800] text-white font-semibold rounded-lg py-3 text-lg mt-2 transition focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a 
            href="/forgot-password" 
            style={{ 
              color: '#ff9800', 
              textDecoration: 'none', 
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            Forgot Password?
          </a>
        </div>
      </form>
      </div>
    </>
  );
} 