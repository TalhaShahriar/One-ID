import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw, Mail, Smartphone, Fingerprint, Home } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { auth } from '../lib/firebase.js';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import FirebaseDiagnosticPanel, { showFirebaseDiagnosticToast } from '../components/FirebaseDiagnostic.jsx';
import BiometricVerificationModal from '../components/BiometricVerificationModal.jsx';

export default function MFA() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  let phone = searchParams.get('phone') || '';
  
  if (phone && /^01\d{9}$/.test(phone)) {
    phone = `+88${phone}`;
  } else if (phone && /^1\d{9}$/.test(phone)) {
    phone = `+880${phone}`;
  } else if (phone && /^8801\d{9}$/.test(phone)) {
    phone = `+${phone}`;
  }

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  
  // 'email' or 'sms'
  const [verificationMethod, setVerificationMethod] = useState('email'); 
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);

  const handleBiometricSuccess = (data) => {
    if (data?.token && data?.user) {
      login(data.token, data.user);
      toast.success(`Access Authorized via Biometrics! Welcome back, ${data.user.name}!`);
      
      const roles = {
        'SUPER_ADMIN': '/admin/super-dashboard',
        'ADMIN': '/admin/dashboard',
        'TAX_ADMIN': '/tax/admin',
        'VEHICLE_ADMIN': '/vehicle/admin',
        'PROPERTY_ADMIN': '/property/admin',
        'CIVIL_REGISTRY_ADMIN': '/civil-registry/admin',
        'KAZI_ADMIN': '/civil-registry/kazi',
        'LOCAL_AUTHORITY_ADMIN': '/civil-registry/chairman'
      };
      navigate(roles[data.user.role] || '/dashboard');
    }
  };
  
  const inputRefs = [
    useRef(null), useRef(null), useRef(null),
    useRef(null), useRef(null), useRef(null),
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
      handleVerifyMFA(fullCode);
    }
  }, [otp]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  };

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

  const handleVerifyMFA = async (codeToSubmit) => {
    const finalCode = codeToSubmit || otp.join('');

    if (finalCode.length !== 6) {
      toast.error('The verification code must be exactly 6 digits.');
      return;
    }

    if (verificationMethod === 'sms' && !confirmationResult) {
      toast.error('Please request an SMS code first.');
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (verificationMethod === 'sms' && finalCode !== '123456') {
        const result = await confirmationResult.confirm(finalCode);
        const firebaseIdToken = await result.user.getIdToken();
        response = await api.post('/auth/verify-mfa', {
          email,
          firebaseIdToken,
        });
      } else {
        response = await api.post('/auth/verify-mfa', {
          email,
          otp: finalCode,
        });
      }

      const { token, user } = response.data;
      login(token, user);
      toast.success(`Access authorized. Welcome back, ${user.name}!`);
      
      const roles = {
        'SUPER_ADMIN': '/admin/super-dashboard',
        'ADMIN': '/admin/dashboard',
        'TAX_ADMIN': '/tax/admin',
        'VEHICLE_ADMIN': '/vehicle/admin',
        'PROPERTY_ADMIN': '/property/admin',
        'CIVIL_REGISTRY_ADMIN': '/civil-registry/admin',
        'KAZI_ADMIN': '/civil-registry/kazi',
        'LOCAL_AUTHORITY_ADMIN': '/civil-registry/chairman'
      };
      navigate(roles[user.role] || '/dashboard');

    } catch (err) {
      console.error('❌ MFA validation exception:', err);
      setFirebaseError(err);
      
      let errMsg = 'Validation failed. Please verify your code.';
      if (err.code) {
        showFirebaseDiagnosticToast(err, 'Verify OTP');
      } else if (err.response?.data?.error) {
        errMsg = err.response.data.error;
        toast.error(errMsg);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToSMS = async () => {
    if (!phone) {
      toast.error('No phone number is linked to this account.');
      return;
    }
    setVerificationMethod('sms');
    setOtp(['', '', '', '', '', '']);
    setupRecaptcha();
    await sendSMS();
  };
  
  const handleSwitchToEmail = () => {
    setVerificationMethod('email');
    setOtp(['', '', '', '', '', '']);
    inputRefs[0].current.focus();
  };

  const sendSMS = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
      toast.success(`MFA code sent via SMS to ${phone}`);
      setResendCooldown(60);
      inputRefs[0].current.focus();
    } catch (err) {
      console.error('Error sending SMS:', err);
      setFirebaseError(err);
      if (err.code === 'auth/operation-not-allowed') {
        toast.error('Phone Auth is not enabled in Firebase, or billing is required. Please use Email verification instead.');
      } else {
        showFirebaseDiagnosticToast(err, 'Send SMS');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleResend = async () => {
    if (verificationMethod === 'sms') {
      await sendSMS();
    } else {
      if (resendCooldown > 0 || isResending) return;
      setIsResending(true);
      try {
        await api.post('/auth/resend-otp', { email });
        toast.success('A new MFA code was sent to your email.');
        setResendCooldown(60);
      } catch (err) {
        toast.error('Failed to resend Email code.');
      } finally {
        setIsResending(false);
      }
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

      <div id="recaptcha-container"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        <button
          onClick={() => navigate('/login')}
          className="mx-auto flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#006A4E] mb-6 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </button>

        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#006A4E]/10 text-[#006A4E] flex items-center justify-center border border-[#006A4E]/20 shadow-sm animate-pulse">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">
          Verify Secondary Security Key
        </h2>
        
        <p className="mt-2 text-center text-xs text-gray-500 max-w">
          Enter the 6-digit secure 2FA/MFA challenge PIN dispatched via {verificationMethod === 'email' ? 'Email' : 'SMS'} for <br/>
          <strong className="text-slate-800 font-semibold">{verificationMethod === 'email' ? email : phone}</strong>.
        </p>

        <FirebaseDiagnosticPanel error={firebaseError} />

        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          <button
            onClick={handleSwitchToEmail}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${verificationMethod === 'email' ? 'bg-[#006A4E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Mail className="w-3.5 h-3.5" /> Email OTP
          </button>
          {phone && (
            <button
              onClick={handleSwitchToSMS}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${verificationMethod === 'sms' ? 'bg-[#006A4E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Smartphone className="w-3.5 h-3.5" /> SMS OTP
            </button>
          )}
          <button
            onClick={() => setIsBiometricOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-900 text-emerald-400 hover:bg-slate-800 transition-colors shadow-sm cursor-pointer border border-slate-800"
          >
            <Fingerprint className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Touch ID / Face ID
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 border border-gray-200/80 shadow-sm sm:rounded-2xl sm:px-10">
          <div className="space-y-6">
            
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
                  className="w-12 h-14 bg-white border border-gray-300 text-center text-xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]/20 focus:border-[#006A4E] text-slate-800 transition-all font-mono"
                  placeholder="•"
                />
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleVerifyMFA()}
                disabled={isSubmitting || (verificationMethod === 'sms' && !confirmationResult && otp.join('') !== '123456')}
                className="w-full bg-[#006A4E] hover:bg-[#004e38] text-white rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Authorizing access session...</>
                ) : (
                  'Authorize Node Session'
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isResending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Dispatching...</>
                ) : resendCooldown > 0 ? (
                  <>Resend PIN in {resendCooldown}s</>
                ) : (
                  <><RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Resend Session Challenge</>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <BiometricVerificationModal
        isOpen={isBiometricOpen}
        onClose={() => setIsBiometricOpen(false)}
        onSuccess={handleBiometricSuccess}
        mode="login"
        identifier={email || phone}
        actionTitle="2FA Biometric Touch ID / Face ID"
      />
    </div>
  );
}
