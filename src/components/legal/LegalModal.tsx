import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import type { SystemSettings } from '../../types';

interface LegalModalProps {
  type: 'terms' | 'privacy' | null;
  settings: SystemSettings | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, settings, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {type === 'terms' ? 'Terms & Conditions of Service' : 'Privacy Protocol & Data Protection'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="whitespace-pre-wrap font-sans text-slate-800">
            {type === 'terms'
              ? settings?.termsAndConditions ||
                '1. Scope of Engagement: Beacon & Harbor provides administrative document review, DS-160 questionnaire preparation assistance, and procedural case management. We do not guarantee visa approval.\n2. Manual Wire Payments: Application fees must be remitted exclusively via direct bank transfer to our verified corporate accounts.\n3. Cancellations & Audits: Once document audit begins, administrative advisory hours are incurred.'
              : settings?.privacyPolicy ||
                'We retain applicant passport bio-data, photographs, employment letters, and bank statements exclusively for evaluating consular compliance. All files are encrypted using TLS 256-bit encryption and are strictly confidential.'}
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
