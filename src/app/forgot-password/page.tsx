'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${apiUrl}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
      } else {
        setSuccess(data.message);
        if (data.otp) {
          setSuccess(`${data.message} (Test OTP: ${data.otp})`);
        }
        setStep('otp');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${apiUrl}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Invalid OTP');
      } else {
        setResetToken(data.resetToken);
        setStep('password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${apiUrl}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword: password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && password.length > 0;
  const canSubmitPassword = isPasswordValid && doPasswordsMatch;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form 
        onSubmit={step === 'email' ? handleEmailSubmit : step === 'otp' ? handleOTPSubmit : handlePasswordSubmit} 
        style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 10px var(--shadow)', padding: '2rem', minWidth: 320, maxWidth: 400, width: '100%' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.8rem', letterSpacing: 1 }}>Forgot Password</h1>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 8 }}>
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'otp' && 'Enter the 6-digit code sent to your email'}
            {step === 'password' && 'Enter your new password'}
          </p>
        </div>

        {step === 'email' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #eee', fontSize: '1rem' }}
                placeholder="Enter your email"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#ff9800] hover:bg-[#ff9800] text-white font-semibold rounded-lg py-3 text-lg transition focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="otp" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>OTP Code</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #eee', fontSize: '1rem', textAlign: 'center', letterSpacing: '0.5rem' }}
                placeholder="000000"
                maxLength={6}
                required
                disabled={loading}
              />
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 4, textAlign: 'center' }}>
                Didn't receive the code? Check your spam folder or try again.
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-[#ff9800] hover:bg-[#ff9800] text-white font-semibold rounded-lg py-3 text-lg transition focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </>
        )}

        {step === 'password' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="password" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: 6, 
                  border: `1px solid ${isPasswordValid ? '#4caf50' : '#e0e0e0'}`, 
                  fontSize: '1rem' 
                }}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
                disabled={loading}
              />
              {password.length > 0 && !isPasswordValid && (
                <p style={{ fontSize: '0.8rem', color: '#f44336', marginTop: 4 }}>
                  Password must be at least 8 characters long
                </p>
              )}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: 6, 
                  border: `1px solid ${confirmPassword.length > 0 ? (doPasswordsMatch ? '#4caf50' : '#f44336') : '#e0e0e0'}`, 
                  fontSize: '1rem' 
                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                disabled={loading}
              />
              {confirmPassword.length > 0 && !doPasswordsMatch && (
                <p style={{ fontSize: '0.8rem', color: '#f44336', marginTop: 4 }}>
                  Passwords do not match
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-[#ff9800] hover:bg-[#ff9800] text-white font-semibold rounded-lg py-3 text-lg transition focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !canSubmitPassword}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}

        {error && (
          <div style={{ 
            color: '#f44336', 
            marginTop: 12, 
            fontSize: '0.9rem', 
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#ffebee',
            borderRadius: '6px',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            color: '#4caf50', 
            marginTop: 12, 
            fontSize: '0.9rem', 
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#e8f5e8',
            borderRadius: '6px',
            border: '1px solid #c8e6c9'
          }}>
            {success}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a 
            href="/login" 
            style={{ 
              color: '#ff9800', 
              textDecoration: 'none', 
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            ← Back to Login
          </a>
        </div>
      </form>
    </div>
  );
} 