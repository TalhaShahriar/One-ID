import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock, Loader2, ArrowRight, Fingerprint, Scan, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import BiometricVerificationModal from '../components/BiometricVerificationModal.jsx';

// Login inputs validation schema
const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'Email or Mobile Number is required.' }),
  password: z.string().min(1, { message: 'Password is required to authenticate.' }),
});

/**
 * Login view.
 * Handles the first stage of secure credentials match checking.
 */
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const enteredIdentifier = watch('identifier') || '';

  const handleBiometricSuccess = (data) => {
    if (data?.token && data?.user) {
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}! Authenticated via Biometrics.`);
      navigate('/');
    }
  };

  /**
   * Action: Handles execution of the credentials handshake.
   */
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let identifier = data.identifier.trim();
      
      // If it looks like a phone number and doesn't start with +880, prepend it
      // Bangladeshi numbers can be 01XXXXXXXXX (11 digits)
      if (/^01\d{9}$/.test(identifier)) {
        identifier = `+88${identifier}`; // +8801...
      } else if (/^1\d{9}$/.test(identifier)) {
        identifier = `+880${identifier}`; // +8801...
      } else if (/^8801\d{9}$/.test(identifier)) {
        identifier = `+${identifier}`;
      }

      const response = await api.post('/auth/login', {
        identifier: identifier,
        password: data.password,
      });

      if (response.data.token) {
        login(response.data.token, response.data.user);
        toast.success(`Welcome back, ${response.data.user.name}!`);
        
        const roleRedirects = {
          'SUPER_ADMIN': '/admin/super-dashboard',
          'ADMIN': '/admin/dashboard',
          'TAX_ADMIN': '/tax/admin',
          'VEHICLE_ADMIN': '/vehicle/admin',
          'PROPERTY_ADMIN': '/property/admin',
          'CIVIL_REGISTRY_ADMIN': '/civil-registry/admin',
          'KAZI_ADMIN': '/civil-registry/kazi',
          'LOCAL_AUTHORITY_ADMIN': '/civil-registry/chairman',
          'VOTER': '/dashboard',
          'CANDIDATE': '/dashboard'
        };

        navigate(roleRedirects[response.data.user.role] || '/dashboard');
        return;
      }

      toast.success(response.data.message || 'MFA required.');

      // Proceed to the MFA screen with both email and phone
      navigate(`/mfa?email=${encodeURIComponent(response.data.email)}&phone=${encodeURIComponent(response.data.phone)}`);
    } catch (err) {
      console.error('❌ Credentials authentication error:', err);
      
      const resData = err.response?.data;
      const errMsg = resData?.error || (err.message === 'Network Error' ? 'Server connection error. Please try again.' : err.message) || 'Credential verification failed.';
      toast.error(errMsg);

      // If the node email exists but is not verified, take them straight to VerifyOTP page!
      if (resData?.unverified) {
        toast.info('Initiating Verification OTP flow for your unverified email address.');
        navigate(`/verify-otp?email=${encodeURIComponent(data.identifier)}`);
      }
    } finally {
      setIsSubmitting(false);
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
            <Lock className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          Welcome to OneID
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Enter your registered login credentials to request secure identity authentication.
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
            
            {/* IDENTIFIER */}
            <div>
              <label htmlFor="identifier" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                Email or Mobile Number
              </label>
              <input
                id="identifier"
                {...register('identifier')}
                type="text"
                autoComplete="email"
                className={`w-full bg-white border ${
                  errors.identifier ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                placeholder="rahim@gmail.com or 017..."
              />
              {errors.identifier && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.identifier.message}</p>
              )}
            </div>
            
            {/* PASSWORD */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[11px] font-bold text-[#006A4E] hover:text-[#004e38] cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className={`w-full bg-white border ${
                  errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
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
              className="w-full bg-[#006A4E] hover:bg-[#004e38] text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 cursor-pointer"
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

            {/* DIVIDER */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400 font-bold uppercase tracking-wider text-[10px]">Or Instant Biometrics</span>
              </div>
            </div>

            {/* BIOMETRIC LOGIN BUTTON */}
            <button
              type="button"
              onClick={() => setIsBiometricOpen(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer border border-slate-800"
            >
              <Fingerprint className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span>Login with Touch ID / Face ID</span>
            </button>

          </form>

          {/* Biometric Verification Modal */}
          <BiometricVerificationModal
            isOpen={isBiometricOpen}
            onClose={() => setIsBiometricOpen(false)}
            onSuccess={handleBiometricSuccess}
            mode="login"
            identifier={enteredIdentifier}
            actionTitle="Biometric Touch ID / Face ID Login"
          />

          <div className="mt-6 border-t border-slate-150 pt-4 text-center">
            <span className="text-xs text-slate-500">First time participating? </span>
            <button
              onClick={() => navigate('/register')}
              className="text-xs font-bold text-[#006A4E] hover:text-[#004e38] font-sans cursor-pointer"
            >
              Enroll Key Nodes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
