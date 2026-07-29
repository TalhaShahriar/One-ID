import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function VerifyOTP() {
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = state?.email || searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const fullCode = otp.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  }, [otp]);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs[index - 1].current.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleVerify = async (codeToSubmit) => {
    const finalCode = codeToSubmit || otp.join('');
    if (finalCode.length !== 6) {
      toast.error('Verification OTP must be exactly 6 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: finalCode,
      });

      if (response.data.token && response.data.user) {
        login(response.data.token, response.data.user);
        toast.success(`Welcome to OneID, ${response.data.user.name}! Account verified and logged in.`);
        navigate('/dashboard');
      } else {
        toast.success(response.data.message || 'OneID registered and verified!');
        navigate('/login');
      }
    } catch (err) {
      console.error('❌ Verification failed:', err);
      const errMsg = err.response?.data?.error || 'Validation failed. Input code does not match.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new 6-digit validation OTP has been sent to your email.');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
    } catch (err) {
      console.error('❌ Failed to resend code:', err);
      toast.error(err.response?.data?.error || 'Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-wider bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        <button
          onClick={() => navigate('/register')}
          className="mx-auto flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#006A4E] mb-6 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Registration
        </button>
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-[#006A4E]/10 text-[#006A4E] flex items-center justify-center border border-[#006A4E]/20 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">
          Verify Your OneID
        </h2>
        <p className="mt-2 text-center text-xs text-gray-500 max-w">
          Enter the 6-digit secure challenge code sent to <strong className="text-slate-800 font-semibold">{email || 'your email'}</strong>.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 border border-gray-200/80 shadow-sm sm:rounded-2xl sm:px-10">
          <div className="space-y-6">
            
            {/* 6 OTP Inputs */}
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 bg-white border border-gray-305 border-gray-300 text-center text-xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] text-slate-800 transition-all font-mono"
                  placeholder="-"
                />
              ))}
            </div>

            {/* Action Triggers */}
            <div className="space-y-3">
              <button
                onClick={() => handleVerify()}
                disabled={isSubmitting}
                className="w-full bg-[#006A4E] hover:bg-[#004e38] text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying OTP...
                  </>
                ) : (
                  'Authorize OneID Credentials'
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Dispatches Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    Resend Code in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Resend Security PIN
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
