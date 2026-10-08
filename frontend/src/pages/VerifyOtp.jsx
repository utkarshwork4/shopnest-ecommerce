import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';
import '../styles/auth.css';

const VerifyOtp = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(location.state?.notice || '');
  const [notice, setNotice] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(
    Number(location.state?.retryAfterSeconds) || 0
  );

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();

      if (response.ok) {
        setIsVerified(true);
        setNotice(data.message || 'Email verified. You can now log in.');
      } else {
        setError(data.message || 'Could not verify this OTP.');
      }
    } catch {
      setError('Unable to verify your email right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    setIsResending(true);

    try {
      const response = await apiFetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setOtp('');
        setCooldownSeconds(Number(data.retryAfterSeconds) || 60);
        setNotice(data.message || 'A new verification code has been sent.');
      } else {
        setCooldownSeconds(Number(data.retryAfterSeconds) || 0);
        setError(data.message || 'Could not resend the verification code.');
      }
    } catch {
      setError('Unable to resend the verification code right now. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Verify your email</h2>
        <p>Enter the 6-digit code sent to your email. It expires in 10 minutes.</p>
        {error && <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>}
        {notice && (
          <p role="status" style={{ color: isVerified ? '#86efac' : '#fcd34d' }}>{notice}</p>
        )}
        {isVerified ? (
          <>
            <Link to="/login" state={{ email }}>Continue to login</Link>
          </>
        ) : (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify email'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleResend}
              disabled={isResending || !email || cooldownSeconds > 0}
            >
              {isResending ? 'Sending...' : cooldownSeconds > 0 ? `Resend OTP in ${cooldownSeconds}s` : 'Resend OTP'}
            </button>
          </>
        )}
        <p>Already verified? <Link to="/login" state={{ email }}>Login</Link></p>
      </form>
    </div>
  );
};

export default VerifyOtp;
