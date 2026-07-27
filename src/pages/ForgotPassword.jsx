import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock, Loader2, ArrowRight, Mail, KeyRound, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../lib/api.js';

// Schema for stage 1 (Request OTP)
const forgotSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid registered email address.' }),
});

// Schema for stage 2 (Verify OTP & Reset Password)
const resetSchema = z.object({
  otp: z.string().length(6, { message: 'The verification OTP code must be exactly 6 digits.' }),
  password: z.string().min(6, { message: 'Your new password must be at least 6 characters.' }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your new password.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(1); // 1 = Request OTP, 2 = Verify and Reset
  const [emailAddress, setEmailAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form handling for Stage 1
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  // Form handling for Stage 2
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm({
    resolver: zodResolver(resetSchema),
  });

  // Handle countdown timer for Resend OTP button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /**
   * Action: Request secure password reset challenge OTP
   */
  const onRequestOTP = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        email: data.email,
      });

      toast.success(response.data.message || 'Verification token sent.');
      setEmailAddress(data.email);
      setStage(2);
      setResendCooldown(30); // 30 seconds cooldown
    } catch (err) {
      console.error('❌ Request reset password OTP failed:', err);
      const errMsg = err.response?.data?.error || 'No registered account found with that email address.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Action: Verify OTP and save the new password
   */
  const onResetPassword = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: emailAddress,
        otp: data.otp,
        password: data.password,
      });

      toast.success(response.data.message || 'Password reset successful!');
      
      // Delay navigation slightly so they can read the toast
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.error('❌ Password reset execution error:', err);
      const errMsg = err.response?.data?.error || 'Verification of OTP code failed.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Action: Resend password reset OTP email
   */
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      const response = await api.post('/auth/forgot-password', {
        email: emailAddress,
      });
      toast.success('A fresh 6-digit verification OTP has been dispatched to your email.');
      setResendCooldown(30);
    } catch (err) {
      console.error('❌ Resending reset OTP failed:', err);
      toast.error(err.response?.data?.error || 'Failed to dispatch a fresh verification OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
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
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#006A4E]/10 text-[#006A4E] flex items-center justify-center border border-[#006A4E]/20 shadow-sm">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          Forgot Password?
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w-sm mx-auto font-medium">
          {stage === 1 
            ? "Enter your registered email address below to receive a secure, cryptographic 6-digit verification OTP code."
            : `We have sent a verification code to ${emailAddress}. Enter the code and your new password below.`
          }
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm sm:rounded-2xl sm:px-10">
          
          <AnimatePresence mode="wait">
            {stage === 1 ? (
              <motion.form 
                key="stage-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6" 
                onSubmit={handleForgotSubmit(onRequestOTP)}
              >
                {/* REGISTERED EMAIL */}
                <div>
                  <label htmlFor="email" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1 flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-[#006A4E]" /> Registered Email Address
                  </label>
                  <input
                    id="email"
                    {...registerForgot('email')}
                    type="email"
                    autoComplete="email"
                    className={`w-full bg-white border ${
                      forgotErrors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                    } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                    placeholder="e.g. rahim@gmail.com"
                  />
                  {forgotErrors.email && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{forgotErrors.email.message}</p>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#006A4E] hover:bg-[#004e38] text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying address...
                    </>
                  ) : (
                    <>
                      Send Password Reset OTP <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="stage-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5" 
                onSubmit={handleResetSubmit(onResetPassword)}
              >
                {/* INFO BADGE */}
                <div className="bg-emerald-50/50 border border-emerald-200/50 p-3 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    Check your outbox for a 6-digit cryptographic challenge code. Enter it below to authorize setting your new credentials.
                  </div>
                </div>

                {/* OTP CODE */}
                <div>
                  <label htmlFor="otp" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-[#006A4E]" /> Enter 6-Digit OTP Code
                  </label>
                  <input
                    id="otp"
                    {...registerReset('otp')}
                    type="text"
                    maxLength={6}
                    className={`w-full text-center bg-white border font-mono tracking-widest text-lg font-black ${
                      resetErrors.otp ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                    } px-3 py-2 text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                    placeholder="000000"
                  />
                  {resetErrors.otp && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{resetErrors.otp.message}</p>
                  )}
                </div>

                {/* NEW PASSWORD */}
                <div>
                  <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-[#006A4E]" /> New Password
                  </label>
                  <input
                    id="password"
                    {...registerReset('password')}
                    type="password"
                    className={`w-full bg-white border ${
                      resetErrors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                    } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                    placeholder="••••••••"
                  />
                  {resetErrors.password && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{resetErrors.password.message}</p>
                  )}
                </div>

                {/* CONFIRM NEW PASSWORD */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-[#006A4E]" /> Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    {...registerReset('confirmPassword')}
                    type="password"
                    className={`w-full bg-white border ${
                      resetErrors.confirmPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                    } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                    placeholder="••••••••"
                  />
                  {resetErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{resetErrors.confirmPassword.message}</p>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#006A4E] hover:bg-[#004e38] text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Committing changes...
                      </>
                    ) : (
                      <>
                        Commit Safe Password Reset <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span>Didn't get the email?</span>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendCooldown > 0}
                      className="font-bold text-[#006A4E] hover:text-[#004e38] disabled:opacity-40 cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* BACK TO PORTAL LINK */}
          <div className="mt-6 border-t border-slate-150 pt-4 text-center">
            <button
              onClick={() => {
                if (stage === 2) {
                  setStage(1);
                } else {
                  navigate('/login');
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 font-sans cursor-pointer"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
