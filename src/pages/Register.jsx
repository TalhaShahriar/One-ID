import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api.js';

// Division dropdown list
const DIVISION_OPTIONS = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'
];

// Zod Schema representing the requested security and profile constraints
const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Full Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, {
    message: 'Please enter a valid Bangladesh mobile format (e.g., +8801XXXXXXXXX or 01XXXXXXXXX).'
  }),
  nid: z.string().regex(/^\d{10}$|^\d{13}$|^\d{17}$/, { 
    message: 'National ID (NID) must be 10, 13, or 17 digits.' 
  }),
  dateOfBirth: z.string().min(1, { message: 'Date of birth is required.' }),
  religion: z.string().min(1, { message: 'Please select your religion.' }),
  maritalStatus: z.string().min(1, { message: 'Please select your marital status.' }),
  division: z.string().min(1, { message: 'Please select your division.' }),
  district: z.string().min(1, { message: 'District is required.' }),
  upazila: z.string().min(1, { message: 'Upazila is required.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must include at least one uppercase letter.' })
    .regex(/\d/, { message: 'Password must include at least one numeric character.' }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"]
});

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
      division: '',
      district: '',
      upazila: '',
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let formattedPhone = data.phone.trim();
      if (/^01\d{9}$/.test(formattedPhone)) {
        formattedPhone = `+88${formattedPhone}`;
      } else if (/^1\d{9}$/.test(formattedPhone)) {
        formattedPhone = `+880${formattedPhone}`;
      } else if (/^8801\d{9}$/.test(formattedPhone)) {
        formattedPhone = `+${formattedPhone}`;
      }

      const response = await api.post('/auth/register', {
        name: data.fullName,
        email: data.email,
        phone: formattedPhone,
        nid: data.nid,
        password: data.password,
        role: 'VOTER', // Citizens register as voters by default on OneID
        constituency: data.division, // satisfying backend constituency constraint
        division: data.division,
        district: data.district,
        upazila: data.upazila,
        dateOfBirth: data.dateOfBirth,
        religion: data.religion,
        maritalStatus: data.maritalStatus,
        occupation: 'Citizen'
      });

      toast.success(response.data.message || 'Verification OTP dispatched successfully!');
      // Proceed to verification by redirecting with email in state
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err) {
      console.error('❌ Sign up exception:', err);
      const errMsg = err.response?.data?.error || 'An unexpected error occurred during user creation.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
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
        className="sm:mx-auto sm:w-full sm:max-w-xl"
      >
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#006A4E]/10 text-[#006A4E] flex items-center justify-center border border-[#006A4E]/20 shadow-sm">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          Join OneID Bangladesh
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Create some standard federated identity credentials to access unified citizen services.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl animate-in fade-in"
      >
        <div className="bg-white py-8 px-6 border border-gray-200/80 shadow-sm sm:rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FULL NAME */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('fullName')}
                  className={`w-full bg-white border ${
                    errors.fullName ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Kazi Rahim Ahmed"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.fullName.message}</p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full bg-white border ${
                    errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                  placeholder="rahim@gmail.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PHONE */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className={`w-full bg-white border ${
                    errors.phone ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                  placeholder="01712345678"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>
                )}
              </div>

              {/* NID */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  National ID (NID)
                </label>
                <input
                  type="text"
                  {...register('nid')}
                  className={`w-full bg-white border ${
                    errors.nid ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-805 rounded-lg focus:outline-none focus:ring-2 transition-all font-mono`}
                  placeholder="1029384756123"
                  maxLength={17}
                />
                {errors.nid && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.nid.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DATE OF BIRTH */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className={`w-full bg-white border ${
                    errors.dateOfBirth ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* RELIGION */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Religion
                </label>
                <select
                  {...register('religion')}
                  className={`w-full border ${
                    errors.religion ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white`}
                >
                  <option value="">Select Religion</option>
                  <option value="ISLAM">Islam</option>
                  <option value="HINDUISM">Hinduism</option>
                  <option value="CHRISTIANITY">Christianity</option>
                  <option value="BUDDHISM">Buddhism</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.religion && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.religion.message}</p>
                )}
              </div>

              {/* MARITAL STATUS */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Marital Status
                </label>
                <select
                  {...register('maritalStatus')}
                  className={`w-full border ${
                    errors.maritalStatus ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white`}
                >
                  <option value="">Select Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
                {errors.maritalStatus && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.maritalStatus.message}</p>
                )}
              </div>

              {/* DIVISION */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Division
                </label>
                <select
                  {...register('division')}
                  className={`w-full bg-white border ${
                    errors.division ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all font-medium`}
                >
                  <option value="">Select Division</option>
                  {DIVISION_OPTIONS.map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
                {errors.division && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.division.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DISTRICT */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  District
                </label>
                <input
                  type="text"
                  {...register('district')}
                  className={`w-full bg-white border ${
                    errors.district ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Dhaka"
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.district.message}</p>
                )}
              </div>

              {/* UPAZILA */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Upazila
                </label>
                <input
                  type="text"
                  {...register('upazila')}
                  className={`w-full bg-white border ${
                    errors.upazila ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Ramna"
                />
                {errors.upazila && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.upazila.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PASSWORD */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className={`w-full bg-white border ${
                    errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className={`w-full bg-white border ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-[#006A4E]/20 focus:border-[#006A4E]'
                  } px-3 py-2 text-sm text-slate-800 rounded-lg focus:outline-none focus:ring-2 transition-all`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-[#006A4E] hover:bg-[#004e38] text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying Registration Parameters...
                </>
              ) : (
                <>
                  Register OneID Node <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-150 pt-4 text-center">
            <span className="text-xs text-slate-500">Already registered your keys? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-[#006A4E] hover:text-[#004e38] font-sans cursor-pointer"
            >
              Sign In Instead
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
