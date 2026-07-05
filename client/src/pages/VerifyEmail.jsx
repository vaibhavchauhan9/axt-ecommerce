import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AlertCircle, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmailOtp, resendVerificationOtp } = useAuth();

  const [email] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const hasAutoSent = useRef(false);

  useEffect(() => {
    if (location.state?.autoSend && email && !hasAutoSent.current) {
      hasAutoSent.current = true;
      (async () => {
        setIsResending(true);
        const result = await resendVerificationOtp(email);
        setIsResending(false);
        if (result.success) {
          setInfo('We sent a verification code to your email — enter it below.');
        } else {
          setError(result.message);
        }
      })();
    }
  }, [location.state, email, resendVerificationOtp]);

  if (!email) {
    return (
      <div className="w-full min-h-screen bg-[#404040] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-white text-sm mb-4">No email found for verification. Please register again.</p>
        <Link to="/register" className="text-[#008BE5] font-bold underline">Go to Register</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsSubmitting(true);

    const result = await verifyEmailOtp(email, otp);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setIsResending(true);
    const result = await resendVerificationOtp(email);
    setIsResending(false);
    if (result.success) {
      setInfo('A new OTP has been sent to your email.');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#404040] flex flex-col items-center justify-start pt-16 pb-20 px-4 select-none">
      <div className="w-full max-w-sm bg-black border-[3px] border-white p-6 md:p-8 flex flex-col items-center">
        <MailCheck className="text-[#008BE5] mb-4" size={40} />
        <h1 className="font-serif font-bold text-2xl md:text-3xl text-white mb-2 text-center tracking-wide">
          Verify your email
        </h1>
        <p className="text-neutral-400 text-xs text-center mb-8">
          We sent a 6-digit code to <span className="text-white font-bold">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {error && (
            <div className="bg-red-600/20 border border-red-500 text-red-400 p-2 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {info && (
            <div className="bg-emerald-600/20 border border-emerald-500 text-emerald-400 p-2 text-xs font-bold text-center">
              {info}
            </div>
          )}

          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-[#333333] h-12 rounded-full px-6 text-center tracking-[0.5em] text-white text-lg font-bold placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#008BE5]"
            placeholder="------"
          />

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full bg-[#008BE5] text-white font-display font-black text-xl h-11 rounded-xl uppercase tracking-wider border-2 border-black drop-shadow-[2px_2px_0px_rgba(250,250,250,1)] hover:bg-[#007acc] transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? '...' : 'VERIFY'}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={isResending}
          className="mt-6 text-xs text-[#008BE5] font-bold hover:underline transition-colors disabled:opacity-50"
        >
          {isResending ? 'Sending...' : "Didn't get a code? Resend"}
        </button>
      </div>
    </div>
  );
    }
