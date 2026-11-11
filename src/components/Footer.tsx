import React from 'react';
import { Compass, Phone, Mail, MapPin, ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
  onOpenPolicy: (type: 'terms' | 'privacy') => void;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicy, onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Wordmark & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <Compass className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Beacon & Harbor
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Private visa application management, document compliance verification, and consular interview preparation consultancy.
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-xs pt-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 256-Bit Encrypted Data & Private Document Vault</span>
            </div>
          </div>

          {/* Col 2: Visa Categories */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Supported Visa Categories
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors text-left"
                >
                  B1/B2 Tourist & Business Visitor
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors text-left"
                >
                  F1 Academic Student Visa
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors text-left"
                >
                  J1 Exchange Visitor & Scholar
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors text-left"
                >
                  H1B Specialty Occupation Work Visa
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors text-left"
                >
                  L1, O1 & Other Non-Immigrant Categories
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Procedural Navigation */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Application & Policies
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('process')}
                  className="hover:text-white transition-colors text-left"
                >
                  4-Step Advisory Workflow
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('payments-info')}
                  className="hover:text-white transition-colors text-left"
                >
                  Manual Bank Transfer Procedures
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('terms')}
                  className="hover:text-white transition-colors text-left"
                >
                  Terms & Conditions of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-white transition-colors text-left"
                >
                  Client Data & Privacy Protocol
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="hover:text-white transition-colors text-left"
                >
                  Advisory Overview
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Advisory Operations Desk */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Advisory Operations
            </h4>
            <div className="space-y-2.5 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>1200 Pennsylvania Ave NW, Suite 800, Washington, D.C. 20004</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+1 (202) 847-9201 (Mon-Fri 09:00 - 18:00 EST)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>advisory@beaconharbor-visa.com</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-300">Certified Case Management Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Beacon & Harbor U.S. Visa Advisory Group LLC. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onOpenPolicy('terms')} className="hover:text-slate-300">
              Terms of Engagement
            </button>
            <span>·</span>
            <button onClick={() => onOpenPolicy('privacy')} className="hover:text-slate-300">
              Privacy Standards
            </button>
            <span>·</span>
            <span>Manual Wire Transfer Verification</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
