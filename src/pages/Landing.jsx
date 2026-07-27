import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Vote, 
  FileText, 
  Car, 
  Home, 
  HeartHandshake, 
  ArrowRight, 
  Award, 
  Database, 
  UserCheck, 
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleCTAClick = (path) => {
    if (isAuthenticated) {
      if (user?.role === 'SUPER_ADMIN') {
        navigate('/admin/super-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827] overflow-x-hidden flex flex-col">
      {/* Styles for visual keyframes animation since we want immediate fade-in effect */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Top Header Row representing Bangladesh Gov Authority */}
      <header className="bg-white border-b border-gray-100 py-3 px-4 sm:px-6 lg:px-8 shadow-2xs z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-[#006A4E] text-white flex items-center justify-center font-bold text-sm shadow">
              BD
            </div>
            <div>
              <span className="font-sans font-extrabold text-sm tracking-tight text-gray-950 block">OneID Bangladesh</span>
              <span className="text-[10px] text-emerald-700 block -mt-1 font-extrabold uppercase tracking-widest">Sovereign Ledger Link</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/blockchain-visualizer"
              className="hidden md:inline-flex min-h-[44px] px-3 py-2 text-gray-600 hover:text-[#006A4E] hover:bg-emerald-50/50 font-bold text-xs rounded-xl transition items-center gap-1.5 border border-transparent hover:border-emerald-100"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Blockchain Ledger</span>
            </Link>
            {isAuthenticated ? (
              <button
                onClick={() => handleCTAClick('/dashboard')}
                className="min-h-[44px] min-w-[124px] px-4 py-2 bg-[#006A4E] hover:bg-[#005a42] text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1 focus:ring-2 focus:ring-[#006A4E] focus:ring-offset-2 focus:outline-none"
              >
                <span>My Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="min-h-[44px] px-4 py-2.5 text-gray-600 hover:text-gray-950 font-bold text-xs transition flex items-center justify-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="min-h-[44px] px-4 py-2.5 bg-[#006A4E] hover:bg-[#005a42] text-white font-bold text-xs rounded-xl transition flex items-center justify-center shadow-xs focus:ring-2 focus:ring-[#006A4E] focus:ring-offset-2"
                >
                  Register OneID
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero: full-width header, BD green gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#006A4E] to-[#004A37] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 shadow-md">
        {/* Background circular ornaments */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-[#F42A41]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Block: Narrative */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wider text-emerald-200 uppercase border border-white/20">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> Decentralized Consensus Engine
            </span>

            {/* Title: Bangla language touch */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-bangla text-white leading-tight">
              এক পরিচয়, সকল সেবা
            </h1>

            {/* Subtitle English below */}
            <p className="text-base sm:text-lg text-emerald-100 max-w-2xl leading-relaxed font-sans">
              One Unified Citizens Identity secured by high-speed cryptographic block structures. Connect to voting, tax filing, vehicle registration, property deeds, and civil marriage registry under one secure sovereign link.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => handleCTAClick('/register')}
                className="min-h-[44px] px-6 py-3 bg-[#F42A41] hover:bg-[#d02035] text-white font-extrabold text-sm rounded-xl transition shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:ring-2 focus:ring-[#F42A41] focus:ring-offset-2"
              >
                Register Online Entry
              </button>
              <button
                onClick={() => handleCTAClick('/login')}
                className="min-h-[44px] px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-extrabold text-sm rounded-xl transition border border-white/20 backdrop-blur-md flex items-center justify-center gap-1.5 cursor-pointer focus:ring-2 focus:ring-white focus:ring-offset-2"
              >
                <span>Access Dashboard Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/blockchain-visualizer"
                className="min-h-[44px] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              >
                <Database className="w-4 h-4 text-white" />
                <span>Live Ledger Monitor</span>
              </Link>
            </div>
          </div>

          {/* Right Block: OneID card graphic fades in on load ( fadeInUp) */}
          <div className="lg:col-span-5 flex justify-center animate-fade-in-up">
            <div className="relative w-full max-w-[380px] bg-gradient-to-br from-[#0c8c68] to-[#043325] text-white rounded-2xl p-6 shadow-2xl border border-white/20 overflow-hidden group">
              
              {/* National flag green-red layout representation */}
              <div className="absolute right-[-40px] top-[-40px] w-48 h-48 bg-[#F42A41]/10 rounded-full" />
              <div className="absolute left-[-20px] bottom-[-20px] w-24 h-24 bg-emerald-500/20 rounded-full blur-xl" />

              {/* Card Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-emerald-800 font-extrabold text-[10px]">
                    BD
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-tight leading-none uppercase">People's Republic</h3>
                    <p className="text-[8px] font-bold text-emerald-250 font-bangla">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-[8px] font-sans font-extrabold bg-[#006a4e] text-white py-0.5 px-2 rounded-full border border-white/20 shadow-xs">
                  <span className="w-1.5 h-1.5 bg-[#F42A41] rounded-full inline-block animate-pulse mr-1" /> SECURE LINK
                </span>
              </div>

              {/* Card Body */}
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center font-bold text-lg text-emerald-100 shadow-inner">
                    BD
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Citizen Identity</span>
                    <p className="text-sm font-extrabold">Citizen Identity Holder</p>
                    <p className="text-[10px] text-emerald-350 font-mono tracking-wider">BD-1092-2026-X8</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] border-t border-white/5">
                  <div>
                    <span className="text-white/40 block leading-none">CONSTITUENCY</span>
                    <strong className="text-emerald-100 block mt-0.5 uppercase">Dhaka-12</strong>
                  </div>
                  <div>
                    <span className="text-white/40 block leading-none">BLOOD GROUP</span>
                    <strong className="text-[#F42A41] block mt-0.5">O+ Positive</strong>
                  </div>
                </div>

                {/* Simulated chips/barcode band */}
                <div className="pt-2 flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-mono tracking-widest opacity-80">SHIELD NODE #BD26</span>
                  </div>
                  <div className="w-16 h-3 bg-white/20 rounded opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 2px, transparent 2px, transparent 4px)' }} />
                </div>
              </div>

              {/* Seal decor */}
              <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
                <ShieldCheck className="w-32 h-32" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats bar: 2.1M+ Citizens Registered */}
      <section className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-around items-center gap-6 text-center">
          <div className="space-y-1">
            <span className="text-2xl font-black text-[#006A4E]">2.1M+</span>
            <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Citizens Enrolled</p>
          </div>
          <div className="hidden md:block w-px h-8 bg-gray-200" />
          <div className="space-y-1">
            <span className="text-2xl font-black text-[#7C3AED]">5 Ministries</span>
            <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">E-Gov Services Integrated</p>
          </div>
          <div className="hidden md:block w-px h-8 bg-gray-200" />
          <div className="space-y-1">
            <span className="text-2xl font-black text-[#0F6E56]">100% Secure</span>
            <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Verified State Ledger</p>
          </div>
        </div>
      </section>

      {/* 5 module cards section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 flex-1">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950">A Unified Democratic Ledger</h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Access secure web portals powered by a decentralized distributed government registry with zero third-party leakage risk.
          </p>
        </div>

        {/* 5 module cards: horizontal scroll mobile, grid desktop */}
        <div className="flex md:grid overflow-x-auto md:overflow-x-visible pb-6 md:pb-0 gap-6 md:grid-cols-5 snap-x">
          
          {/* Card 1: Voting */}
          <div className="min-w-[280px] md:min-w-0 snap-center bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-t-4 border-t-[#7C3AED]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                <Vote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-950">Voter Cabinet</h3>
                <span className="text-[10px] text-[#7C3AED] font-bangla font-bold block mt-0.5">ভোটিং</span>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Decentralized, anonymous ballot cabinet to secure, cast, and verify democratic election votes.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleCTAClick('/login')}
              className="mt-6 flex items-center gap-1 text-xs font-bold text-[#7C3AED] hover:underline"
            >
              Enter cabinet <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Tax */}
          <div className="min-w-[280px] md:min-w-0 snap-center bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-t-4 border-t-[#D97706]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-950">Tax & Revenue</h3>
                <span className="text-[10px] text-[#D97706] font-bangla font-bold block mt-0.5">কর ব্যবস্থাপনা</span>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Automated calculators and receipts tracking for direct state-linked income taxes.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleCTAClick('/login')}
              className="mt-6 flex items-center gap-1 text-xs font-bold text-[#D97706] hover:underline"
            >
              Enter taxonomy <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Vehicles */}
          <div className="min-w-[280px] md:min-w-0 snap-center bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-t-4 border-t-[#0F6E56]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 text-[#0F6E56] flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-950">Vehicle Registry</h3>
                <span className="text-[10px] text-[#0F6E56] font-bangla font-bold block mt-0.5">যানবাহন</span>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Driving licenses validation and immediate peer-to-peer ownership sequence transfers.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleCTAClick('/login')}
              className="mt-6 flex items-center gap-1 text-xs font-bold text-[#0F6E56] hover:underline"
            >
              Enter garage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Land */}
          <div className="min-w-[280px] md:min-w-0 snap-center bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-t-4 border-t-[#D85A30]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#D85A30]/10 text-[#D85A30] flex items-center justify-center">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-950">Property Cabinet</h3>
                <span className="text-[10px] text-[#D85A30] font-bangla font-bold block mt-0.5">সম্পত্তি</span>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Deed ownership registers protected against unauthorized manual manipulation.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleCTAClick('/login')}
              className="mt-6 flex items-center gap-1 text-xs font-bold text-[#D85A30] hover:underline"
            >
              Enter deeds <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5: Civil */}
          <div className="min-w-[280px] md:min-w-0 snap-center bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-t-4 border-t-[#D4537E]">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4537E]/10 text-[#D4537E] flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-950">Civil Registry</h3>
                <span className="text-[10px] text-[#D4537E] font-bangla font-bold block mt-0.5">সিভিল রেজিস্ট্রি</span>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Unified Nikahnama registry, marriage registration, and formal Union arbitration checks.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleCTAClick('/login')}
              className="mt-6 flex items-center gap-1 text-xs font-bold text-[#D4537E] hover:underline"
            >
              Enter registry <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* CTA section: */}
      <section className="bg-gray-100/50 border-t border-gray-205 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-black font-bangla tracking-tight text-gray-950">
            বাংলাদেশের ডিজিটাল ভবিষ্যৎ
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
            Secure, uncorruptible e-governance solutions running at state heights. Start your registration or connect existing credentials now.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <button
              onClick={() => handleCTAClick('/register')}
              className="min-h-[44px] min-w-[160px] px-6 py-2.5 bg-[#006A4E] hover:bg-[#005a42] text-white font-extrabold text-xs rounded-xl shadow-md transition-all focus:ring-2 focus:ring-[#006A4E]"
            >
              Enroll Online National ID
            </button>
            <button
              onClick={() => handleCTAClick('/login')}
              className="min-h-[44px] min-w-[160px] px-6 py-2.5 border border-gray-300 hover:bg-gray-55 bg-white text-gray-800 font-extrabold text-xs rounded-xl shadow-2xs transition-all focus:ring-2 focus:ring-gray-300"
            >
              Access My Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
