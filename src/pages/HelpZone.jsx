import React, { useState } from 'react';
import { HelpCircle, FileText, ChevronDown, BookOpen, ShieldCheck, Mail, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpZone = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      question: "What is Bangladesh OneID?",
      answer: "Bangladesh OneID is a unified digital identity standard. It links all your civic services including voting, tax compliance, property records, civil registry, and vehicle licensing into a single, immutable, blockchain-secured profile."
    },
    {
      question: "How does the blockchain secure my vote?",
      answer: "Your vote is recorded as a cryptographic hash on our ledger. It uses Merkle Trees to ensure data integrity, meaning no one (not even administrators) can alter or delete your ballot once cast. You receive a blind token receipt to verify it."
    },
    {
      question: "Can I transfer property entirely online?",
      answer: "Yes. Both buyer and seller use cryptographic signatures (OTP/MFA) to sign the digital deed. Once both parties consent and the payment is verified, the Land Ministry Admin approves it, transferring ownership instantly."
    },
    {
      question: "Why do I need a Firebase verification code?",
      answer: "For critical actions like transferring a vehicle or modifying a civil record, Multi-Factor Authentication (MFA) ensures that only you, the verified owner of the OneID, are authorizing the transaction."
    },
    {
      question: "How do I check my road tax or traffic fines?",
      answer: "Navigate to the 'Vehicle & Transport' module. You can view your registered vehicles, pending road taxes, and any traffic violations tied to your Driving License."
    },
    {
      question: "Is my data scalable and highly available?",
      answer: "Yes, the system leverages cloud infrastructure with distributed PostgreSQL (Cloud SQL) for relational data and blockchain logic for transaction sealing. It guarantees high availability, rapid reads, and horizontally scalable storage."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-emerald-900 to-[#006A4E] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight mb-4 flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-emerald-300" />
            Citizen Help Zone
          </h1>
          <p className="text-emerald-50 text-base leading-relaxed">
            Welcome to the centralized support and documentation center. Find comprehensive user manuals, process workflows, and technical FAQs covering all modules of the Bangladesh OneID platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">System Manuals</h2>
          </div>
          <div className="space-y-4">
            {[
              { title: "Voting & Election Flow", desc: "Learn how to cast, verify, and track your cryptographic ballot." },
              { title: "Property Transfer Wizard", desc: "Step-by-step guide to digital land deeds and buyer consent." },
              { title: "Tax & NBR Integration", desc: "How to calculate income tax and generate clearance certificates." },
              { title: "Civil Registry (Marriage/Divorce)", desc: "Guide for Nikahnama registration and Kazi arbitration flows." }
            ].map((manual, idx) => (
              <div key={idx} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                <div className="bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 p-2 rounded-lg transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{manual.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{manual.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-800 pr-4">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-white text-xs leading-relaxed text-slate-600 border-t border-slate-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Need specialized technical support?
          </h3>
          <p className="text-xs text-slate-500 mt-1">Our blockchain architects and civil registry admins are available.</p>
        </div>
        <button className="px-5 py-2.5 bg-white border border-slate-300 shadow-sm text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shrink-0">
          <Mail className="w-4 h-4" />
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default HelpZone;
