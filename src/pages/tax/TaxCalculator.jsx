import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Calculator, 
  Flag, 
  Building2, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2 
} from 'lucide-react';

export default function TaxCalculator() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState({
    gender: 'MALE',
    dateOfBirth: '1990-01-01',
    residencyType: 'DHAKA',
    grossIncome: ''
  });
  
  const [calculation, setCalculation] = useState(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field, val) => {
    setDetails(prev => ({ ...prev, [field]: val }));
  };

  // Convert step transitions
  const goToStep2 = () => {
    if (!details.dateOfBirth) {
      toast.error('Date of Birth is mandatory.');
      return;
    }
    setStep(2);
  };

  const goToStep3 = async () => {
    const incomeNum = parseFloat(details.grossIncome);
    if (!details.grossIncome || isNaN(incomeNum) || incomeNum < 0) {
      toast.error('Please input a valid non-negative Gross Income.');
      return;
    }

    setLoadingCalc(true);
    try {
      const resp = await api.post('/tax/calculate', {
        grossIncome: incomeNum,
        gender: details.gender,
        dateOfBirth: details.dateOfBirth,
        residencyType: details.residencyType,
        taxYear: 2026
      });
      setCalculation(resp.data);
      setStep(3);
    } catch (err) {
      console.error('Calculation preview error:', err);
      toast.error('Could not construct assessment breakdown.');
    } finally {
      setLoadingCalc(false);
    }
  };

  // Submit actual Return to NBR
  const handleConfirmAndSubmit = async () => {
    setSubmitting(true);
    try {
      const resp = await api.post('/tax/submit', {
        taxYear: 2026,
        grossIncome: parseFloat(details.grossIncome),
        gender: details.gender,
        residencyType: details.residencyType
      });
      
      toast.success('Tax Return successfully e-filed and sealed in Ledger!');
      navigate(`/tax/receipt/${resp.data.receiptNumber}`);
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.response?.data?.error || 'Tax return submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 font-sans" id="tax-calculator-container">
      {/* Back to dashboard */}
      <button 
        onClick={() => navigate('/tax')} 
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold bg-slate-100 px-3 py-1.5 rounded-lg transition border border-slate-200 cursor-pointer"
        id="back-to-tax-dashboard-btn"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Tax Dashboard
      </button>

      {/* App Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
          <Calculator className="h-6 w-6 text-emerald-600" /> NBR Smart Tax Return Filing
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Step-by-step verified self-assessment filing for the current tax year 2026.
        </p>
      </div>

      {/* Progress indicators */}
      <div className="flex items-center justify-between border-t border-b border-slate-150 py-4 font-bold" id="calculator-steps-tab">
        <div className={`flex items-center gap-1.5 text-xs ${step === 1 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
          <span className={`inline-flex h-5 w-5 rounded-full items-center justify-center text-[10px] ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
          Personal Factors
        </div>
        <div className="h-0.5 bg-slate-200 w-8"></div>
        <div className={`flex items-center gap-1.5 text-xs ${step === 2 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
          <span className={`inline-flex h-5 w-5 rounded-full items-center justify-center text-[10px] ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
          Gross Income
        </div>
        <div className="h-0.5 bg-slate-200 w-8"></div>
        <div className={`flex items-center gap-1.5 text-xs ${step === 3 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
          <span className={`inline-flex h-5 w-5 rounded-full items-center justify-center text-[10px] ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
          Review & File
        </div>
      </div>

      {/* STEP 1 CONTAINER: GENDER, DOB, RESIDENCYTYPE */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="calc-step-1">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-black font-mono">Step 1 of 3: Taxpayer Exemptions & Slabs Factors</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Gender Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('gender', 'MALE')}
                  className={`py-3 px-4 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${details.gender === 'MALE' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  Male (General Threshold)
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('gender', 'FEMALE')}
                  className={`py-3 px-4 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${details.gender === 'FEMALE' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  Female (Exemption Slab)
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Bangladesh NBR gives a tax-free limit of BDT 4,00,000 for lady citizens.</p>
            </div>

            {/* Date of Birth Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 block">Date of Birth</label>
              <input
                type="date"
                value={details.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">Seniors (65 or older) receive an elevated BDT 4,00,000 threshold.</p>
            </div>
          </div>

          {/* City / Residency Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 block">City Corporation / Location</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { type: 'DHAKA', label: 'Dhaka City Corp', min: 'BDT 5,000' },
                { type: 'CHITTAGONG', label: 'Ctg City Corp', min: 'BDT 5,000' },
                { type: 'OTHER', label: 'Other Cities / Rural', min: 'BDT 2,000' }
              ].map((loc) => (
                <button
                  key={loc.type}
                  type="button"
                  onClick={() => handleInputChange('residencyType', loc.type)}
                  className={`flex flex-col p-4 border rounded-xl text-left transition cursor-pointer ${details.residencyType === loc.type ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <span className="text-xs font-extrabold">{loc.label}</span>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono">Minimum Tax: {loc.min}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={goToStep2}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer"
              id="calc-step-1-next"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 CONTAINER: GROSS INCOME */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="calc-step-2">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-black font-mono">Step 2 of 3: Assessable Gross Income</h3>
          
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-700 block">Total Yearly Gross Income (BDT ৳)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">৳</span>
              <input
                type="number"
                placeholder="0.00"
                value={details.grossIncome}
                onChange={(e) => handleInputChange('grossIncome', e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-mono text-base font-bold focus:border-emerald-500 focus:outline-none"
                id="gross-income-input"
              />
            </div>
            
            {details.grossIncome && !isNaN(parseFloat(details.grossIncome)) && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-[11px] font-mono font-bold text-right">
                In words: {parseFloat(details.grossIncome).toLocaleString()} Taka Only
              </div>
            )}
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Include salaries, estate rental incomes, commercial profits, agricultural yields, capital gains, and financial dividend revenues.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={goToStep3}
              disabled={loadingCalc}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-sm cursor-pointer"
              id="calc-step-2-next"
            >
              {loadingCalc ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Previewing...
                </>
              ) : (
                <>
                  Calculate Slabs <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 CONTAINER: REVIEW & BREAKDOWN */}
      {step === 3 && calculation && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="calc-step-3">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-black font-mono">Step 3 of 3: Comprehensive Review</h3>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Verify the Bangladesh NBR 2025-2026 progressive slab schedule below.</p>
            </div>
            <span className="text-[10px] uppercase font-mono font-extrabold bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-indigo-700">
              Draft Preview
            </span>
          </div>

          {/* Highlight Box showing Final Tax */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden space-y-3" id="final-tax-highlight">
            <p className="text-[10px] tracking-widest uppercase font-mono text-[#a7f3d0] font-bold">Total Assessed Income Tax Liability Due</p>
            <h2 className="text-3xl font-mono font-black tracking-wider text-emerald-400">
              ৳ {calculation.finalTax.toLocaleString()} <span className="text-xs text-white">BDT</span>
            </h2>
            <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono border-t border-slate-800 pt-3">
              <span>Gross Income: ৳ {calculation.grossIncome.toLocaleString()}</span>
              <span>Calculated: ৳ {calculation.calculatedTax.toLocaleString()}</span>
              <span>Minimum: ৳ {calculation.minimumTax.toLocaleString()}</span>
            </div>
          </div>

          {/* Slab Breakdown Table */}
          <div className="space-y-2" id="slab-breakdown-table">
            <h4 className="text-xs font-black text-slate-700">Progressive Slab Breakdown</h4>
            <div className="border border-slate-100 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 font-sans font-bold text-slate-500">
                    <th className="p-3">Exemption / Slab Category</th>
                    <th className="p-3 text-center">Tax Rate</th>
                    <th className="p-3 text-right">Tax Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculation.breakdown?.map((slab, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 font-sans font-medium text-slate-600">{slab.slab}</td>
                      <td className="p-3 text-center text-slate-500">{slab.rate}%</td>
                      <td className="p-3 text-right font-bold text-slate-750">BDT {slab.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anomaly Warn Hint */}
          {(parseFloat(details.grossIncome) > 10000000) && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-[11px] font-bold text-amber-800">High-Value First filing Flagged Anomaly Alert</h5>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  Notice: Under NBR digital rules, any first tax record filing disclosing gross earnings in excess of BDT 10 million is auto-flagged for review. A validation audit will perform checks.
                </p>
              </div>
            </div>
          )}

          {/* Step 3 Control Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={handleConfirmAndSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition shadow cursor-pointer animate-pulse"
              id="confirm-submit-tax-btn"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Blockchain Sealing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Confirm & File Return (FY 2026)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
