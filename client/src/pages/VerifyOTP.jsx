import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldAlert, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api.js';

/**
 * VerifyOTP Page.
 * Authenticates email verification OTPs through individual digit terminals.
 */
export default function VerifyOTP() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Focus managers for the 6 secure terminals
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Tick the cooldown timer every second
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle auto-submit when the OTP array is fully filled
  useEffect(() => {
    const fullCode = otp.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  }, [otp]);

  /**
   * Action: Handles digit entry changes.
   */
  const handleChange = (index, value) => {
    // Only permit digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance cursor to the next digit terminal
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  /**
   * Action: Handles deletion and arrow-keys.
   */
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Backtrack focus if target is empty
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

  /**
   * Action: Submits verification challenge token.
   */
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

      toast.success(response.data.message || 'Verification successful! Node key registered.');
      navigate('/login');
    } catch (err) {
      console.error('❌ Verification transaction failed:', err);
      const errMsg = err.response?.data?.error || 'Validation failed. Input code matches no active registration.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Action: Resends verification token.
   */
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new 6-digit validation OTP has been dispatched to your email.');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
    } catch (err) {
      console.error('❌ Failed to dispatch resend parameters:', err);
      toast.error(err.response?.data?.error || 'Failed to dispatch resend request. Please retry.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <button
          onClick={() => navigate('/register')}
          className="mx-auto flex items-center gap-1 text-xs font-bold text-slate-550 hover:text-indigo-600 mb-6 bg-white border border-slate-200 shadow-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Registration
        </button>
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Verify Node Address
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w">
          Enter the 6-digit security credential code sent to <strong className="text-slate-800 font-semibold">{email}</strong>.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm sm:rounded-2xl sm:px-10">
          <div className="space-y-6">
            
            {/* 6 TERMINALS */}
            <div className="flex justify-between gap-2.5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 bg-white border border-slate-300 text-center text-xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition-all font-mono"
                  placeholder="-"
                />
              ))}
            </div>

            {/* ACTION TRIGGERS */}
            <div className="space-y-3.5">
              <button
                onClick={() => handleVerify()}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying Challenge Token...
                  </>
                ) : (
                  'Authorize Node Identity'
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-600 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Resend Verification Code
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
