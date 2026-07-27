import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api.js';

// Login inputs validation schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required to authenticate.' }),
});

/**
 * Login view.
 * Handles the first stage of secure credentials match checking.
 */
export default function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Action: Handles execution of the credentials handshake.
   */
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      toast.success(response.data.message || 'Verification token sent.');
      // Proceed to the MFA screen
      navigate(`/mfa?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      console.error('❌ Credentials authentication error:', err);
      
      const resData = err.response?.data;
      const errMsg = resData?.error || 'Credential verification failed.';

      toast.error(errMsg);

      // If the node email exists but is not verified, take them straight to VerifyOTP page!
      if (resData?.unverified) {
        toast.info('Initiating Verification OTP flow for your unverified email address.');
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      }
    } finally {
      setIsSubmitting(false);
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
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#006a4e] flex items-center justify-center border border-emerald-100 shadow-sm">
            <Lock className="h-5 w-5" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign In to OneID
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w">
          Enter registered credentials to authenticate your nodes and request entry.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                Email Address
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                autoComplete="email"
                className={`w-full bg-white border ${
                  errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                placeholder="rahim@gmail.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                Password
              </label>
              <input
                id="password"
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className={`w-full bg-white border ${
                  errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#006a4e] hover:bg-[#00523c] text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Handshaking credentials...
                </>
              ) : (
                <>
                  Initiate MFA Challenge <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

          </form>

          <div className="mt-6 border-t border-slate-150 pt-4 text-center">
            <span className="text-xs text-slate-500">First time participating? </span>
            <button
              onClick={() => navigate('/register')}
              className="text-xs font-bold text-[#006a4e] hover:text-[#00513c] font-sans cursor-pointer"
            >
              Enroll Key Nodes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
