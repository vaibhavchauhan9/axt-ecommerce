import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, KeyRound, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

// 3-step OTP-based password reset flow:
// 1) Enter email -> request OTP
// 2) Enter 6-digit OTP -> verify (with resend + cooldown)
// 3) Enter new password -> commit reset
export default function ForgotPasswordModal({ onClose }) {
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef([]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Lock background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const otpString = otp.join('');

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const requestOtp = async (isResend = false) => {
    setError('');
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      showToast(isResend ? 'OTP resent to your email.' : 'OTP sent to your registered email.', 'success');
      setResendCooldown(60);
      if (!isResend) {
        setOtp(['', '', '', '', '', '']);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!email) return;
    requestOtp(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/verify-reset-otp', { email, otp: otpString });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { email, otp: otpString, newPassword });
      showToast('Password reset successfully. Please log in.', 'success');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-black border-[3px] border-white rounded-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-neutral-400 transition-colors"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <h2 className="font-serif font-bold text-2xl md:text-3xl text-white mb-2 text-center tracking-wide">
          Reset Password
        </h2>
        <p className="text-neutral-400 text-xs text-center mb-6">
          {step === 1 && 'Enter your registered Gmail to receive a one-time code.'}
          {step === 2 && `Enter the 6-digit code sent to ${email}`}
          {step === 3 && 'Choose a new password for your account.'}
        </p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-[#008BE5]' : s < step ? 'w-4 bg-[#39FF14]' : 'w-4 bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-500 text-red-400 p-2 text-xs font-bold text-center flex items-center justify-center gap-2 mb-4">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* STEP 1: Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="w-full flex flex-col gap-5">
            <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all">
              <Mail className="text-white shrink-0" size={20} />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
                placeholder="Registered Gmail address"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full bg-[#008BE5] text-white font-display font-black text-lg h-11 rounded-xl uppercase tracking-wider border-2 border-black drop-shadow-[2px_2px_0px_rgba(250,250,250,1)] hover:bg-[#007acc] transition-all transform active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-5">
            <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={i === 0}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-full aspect-square min-w-0 bg-[#333333] text-white text-center text-lg font-bold rounded-lg border border-transparent focus:border-[#008BE5] focus:outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpString.length !== 6}
              className="w-full bg-[#008BE5] text-white font-display font-black text-lg h-11 rounded-xl uppercase tracking-wider border-2 border-black drop-shadow-[2px_2px_0px_rgba(250,250,250,1)] hover:bg-[#007acc] transition-all transform active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                &larr; Change email
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0 || isSubmitting}
                onClick={() => requestOtp(true)}
                className="text-[#008BE5] font-bold hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-5">
            <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all relative">
              <Lock className="text-white shrink-0" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 pr-8 focus:outline-none"
                placeholder="New password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-white hover:text-neutral-400 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} strokeWidth={2.5} />}
              </button>
            </div>

            <div className="w-full bg-[#333333] h-12 rounded-full px-4 flex items-center gap-3 border border-transparent focus-within:border-[#008BE5] transition-all">
              <KeyRound className="text-white shrink-0" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent text-white text-sm font-sans placeholder-neutral-500 focus:outline-none"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#008BE5] text-white font-display font-black text-lg h-11 rounded-xl uppercase tracking-wider border-2 border-black drop-shadow-[2px_2px_0px_rgba(250,250,250,1)] hover:bg-[#007acc] transition-all transform active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
