import React, { useState } from 'react';
import { ShieldCheck, Calendar, MapPin, User, Briefcase, Mail, Phone, QrCode } from 'lucide-react';
import api from '../../lib/api.js';

/**
 * OneIDCard Component
 * Renders a high-security visual representation of the Bangladesh OneID Identity.
 * Supports 'full' (dashboard detail) and 'mini' (header/sidebar widget) variants.
 */
export default function OneIDCard({ user, variant = 'full' }) {
  const [showQR, setShowQR] = useState(false);

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'BD';

  const formattedDate = user.dateOfBirth 
    ? new Date(user.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not Specified';

  if (variant === 'mini') {
    return (
      <div className="relative overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
        {/* Left Green Accent border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#006A4E]" />
        
        <div className="flex items-center space-x-3">
          {/* Circular avatar with high quality BD theme */}
          <div className="w-10 h-10 rounded-full bg-[#006A4E]/10 flex items-center justify-center text-[#006A4E] font-bold text-sm border border-[#006A4E]/20">
            {initials}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-gray-900 truncate text-sm">{user.name}</h4>
              <ShieldCheck className="w-4 h-4 text-[#006A4E] shrink-0" />
            </div>
            <p className="text-xs font-mono text-[#006A4E] font-medium tracking-wider truncate mb-0.5">
              {user.oneid || 'N/A'}
            </p>
            <p className="text-[10px] text-gray-500 truncate capitalize">
              {user.role?.toLowerCase()?.replace('_', ' ') || 'Citizen'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full Variant
  return (
    <div className="relative bg-white rounded-2xl border border-gray-200/80 shadow-lg overflow-hidden max-w-full">
      {/* Upper Security Stripe - BD flag theme with green field and red circle accent */}
      <div className="bg-[#006A4E] h-4 w-full flex relative overflow-hidden">
        <div className="bg-[#F42A41] w-12 h-12 rounded-full absolute -top-4 left-6 border-2 border-white shadow-sm" />
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
          
          {/* Left Block: Avatar and Core Details */}
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left flex-1">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#006A4E] to-[#005a42] text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md relative z-10">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-gray-100 shadow z-20">
                <div className="bg-[#006A4E] p-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{user.name}</h3>
                <span className="self-center sm:self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified Citizen
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block">OneID Number:</span>
                <p className="text-lg md:text-xl font-mono text-[#006A4E] font-bold tracking-widest bg-gray-50 px-3 py-1 rounded-md border border-gray-100 select-all inline-block">
                  {user.oneid || 'BD-NOTASSIGNED'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Block: Verification Badge / QR Code Toggle */}
          <div className="w-full lg:w-auto self-stretch lg:self-start flex flex-row lg:flex-col justify-end lg:justify-start items-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-100">
            {showQR ? (
              <div className="flex flex-col items-center justify-center p-3 border border-gray-100 bg-gray-50 rounded-xl relative">
                <img 
                  src={`/api/citizen/oneid-qr?t=${new Date().getTime()}`} 
                  alt="OneID QR Check" 
                  className="w-28 h-28 object-contain mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setShowQR(false)} 
                  className="mt-1.5 text-[10px] text-gray-500 hover:text-[#006A4E] font-medium underline"
                >
                  Hide Security Code
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowQR(true)}
                className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 hover:border-[#006A4E] bg-gray-50 rounded-xl w-28 h-28 cursor-pointer group transition-colors"
                id="oneid-qr-trigger"
              >
                <QrCode className="w-8 h-8 text-gray-400 group-hover:text-[#006A4E] mb-2 transition-colors" />
                <span className="text-[10px] text-gray-500 group-hover:text-[#006A4E] font-semibold text-center leading-tight">
                  View QR Scanner
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section: 2-column Metadata Detail List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100 text-sm text-gray-700">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase block leading-none mb-0.5">Corporate Email</span>
                <span className="font-semibold block truncate text-gray-800">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase block leading-none mb-0.5">Secure Phone No</span>
                <span className="font-semibold block text-gray-800">{user.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase block leading-none mb-0.5">Constituency Scope</span>
                <span className="font-semibold block text-gray-800 capitalize leading-tight">
                  {user.upazila || 'Ramna'}, {user.district || 'Dhaka'} ({user.constituency || 'Dhaka-8'})
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase block leading-none mb-0.5">Date of Birth</span>
                <span className="font-semibold block text-gray-800">{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase block leading-none mb-0.5">Active Occupation</span>
                <span className="font-semibold block text-gray-800 capitalize">{user.occupation || 'Professional'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-500 uppercase block leading-none mb-0.5">Role Authorization</span>
                <span className="font-semibold block text-gray-800 capitalize">
                  {user.role?.toLowerCase()?.replace('_', ' ') || 'Citizen'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Holographic Thread on edge represent high security ID cards */}
      <div className="absolute right-0 bottom-0 top-4 w-[6px] bg-gradient-to-b from-[#006A4E] via-[#F42A41] to-[#006A4E] opacity-75" />
    </div>
  );
}
