import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api.js';

// Define the 20 regional election constituencies of Bangladesh
const BANGLADESH_CONSTITUENCIES = [
  'Dhaka-1', 'Dhaka-2', 'Dhaka-3', 'Dhaka-4', 'Dhaka-5',
  'Dhaka-6', 'Dhaka-7', 'Dhaka-8', 'Dhaka-9', 'Dhaka-10',
  'Dhaka-11', 'Dhaka-12', 'Dhaka-13', 'Dhaka-14', 'Dhaka-15',
  'Dhaka-16', 'Dhaka-17', 'Dhaka-18', 'Dhaka-19', 'Dhaka-20'
];

// Zod Schema representing the requested security constraints
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, {
    message: 'Please enter a valid Bangladesh mobile phone format (e.g., +8801XXXXXXXXX or 01XXXXXXXXX).'
  }),
  nid: z.string().regex(/^\d{13}$/, { message: 'National ID (NID) must be exactly 13 digits.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must include at least one uppercase letter.' })
    .regex(/\d/, { message: 'Password must include at least one numeric character.' }),
  role: z.enum(['VOTER', 'CANDIDATE'], {
    errorMap: () => ({ message: 'Please select your registry role.' })
  }),
  constituency: z.string().min(1, { message: 'Please choose your designated constituency area.' }),
});

/**
 * Register Page component.
 * Allows voters and candidates to sign up and start OTP enrollment.
 */
export default function Register() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'VOTER',
      constituency: '',
    }
  });

  /**
   * Action: Handles submission of sign up parameters.
   */
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        nid: data.nid,
        password: data.password,
        role: data.role,
        constituency: data.constituency
      });

      toast.success(response.data.message || 'OTP successfully dispatched!');
      // Proceed to verification passing email in query params
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      console.error('❌ Sign up transaction exception:', err);
      const errMsg = err.response?.data?.error || 'An unexpected error occurred during user creation.';
      toast.error(errMsg);
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
            <Shield className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Security Identity
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w">
          Enter validated credentials to authorize node enrollment in OneID.
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
            {/* NAME */}
            <div>
              <label htmlFor="name" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                Full Name
              </label>
              <input
                id="name"
                {...register('name')}
                type="text"
                autoComplete="name"
                className={`w-full bg-white border ${
                  errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                placeholder="Rahim Ahmed"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>
              )}
            </div>

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

            {/* PHONE */}
            <div>
              <label htmlFor="phone" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                Mobile Number
              </label>
              <input
                id="phone"
                {...register('phone')}
                type="tel"
                className={`w-full bg-white border ${
                  errors.phone ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                placeholder="+88017XXXXXXXX"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>
              )}
            </div>

            {/* NID */}
            <div>
              <label htmlFor="nid" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                National ID (13-Digits)
              </label>
              <input
                id="nid"
                {...register('nid')}
                type="text"
                maxLength={13}
                className={`w-full bg-white border ${
                  errors.nid ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all font-mono`}
                placeholder="1029384756123"
              />
              {errors.nid && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.nid.message}</p>
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
                className={`w-full bg-white border ${
                  errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* ROLE */}
              <div>
                <label htmlFor="role" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                  Enrolling As
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className="w-full bg-white border border-slate-300 px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                >
                  <option value="VOTER">Voter</option>
                  <option value="CANDIDATE">Candidate</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.role.message}</p>
                )}
              </div>

              {/* CONSTITUENCY */}
              <div>
                <label htmlFor="constituency" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                  Constituency
                </label>
                <select
                  id="constituency"
                  {...register('constituency')}
                  className="w-full bg-white border border-slate-300 px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                >
                  <option value="">Choose Constituency</option>
                  {BANGLADESH_CONSTITUENCIES.map((cl) => (
                    <option key={cl} value={cl}>
                      {cl}
                    </option>
                  ))}
                </select>
                {errors.constituency && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.constituency.message}</p>
                )}
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#006a4e] hover:bg-[#00523c] text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enrolling Wallet Node...
                </>
              ) : (
                <>
                  Register Secure Node <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-150 pt-4 text-center">
            <span className="text-xs text-slate-500">Already registered your keys? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-[#006a4e] hover:text-[#00513c] font-sans cursor-pointer"
            >
              Sign In Instead
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
