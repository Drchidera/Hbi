import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Compass, User, LogOut, Bell, ShieldCheck, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenNotifications,
}) => {
  const { user, logout, unreadNotifsCount, needsAdminSetup } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand wordmark (single text element with icon) */}
        <button
          onClick={() => {
            onNavigate('landing');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left text-slate-900 group cursor-pointer whitespace-nowrap shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
            <Compass className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Beacon & Harbor
          </span>
        </button>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'landing' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Advisory Services
          </button>
          <button
            onClick={() => onNavigate('categories')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'categories' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Visa Categories
          </button>
          <button
            onClick={() => onNavigate('process')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'process' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Application Workflow
          </button>
          <button
            onClick={() => onNavigate('payments-info')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'payments-info' ? 'text-slate-900 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Manual Payment Guide
          </button>
          {user && (
            <button
              onClick={() => onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'applicant-dashboard')}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                currentView.includes('dashboard') ? 'text-amber-700 font-semibold' : 'text-slate-900 font-medium hover:text-amber-700'
              }`}
            >
              {user.role === 'admin' ? 'Administrative Console' : 'Applicant Portal'}
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action or authenticated control */}
        <div className="flex items-center gap-3 shrink-0">
          {needsAdminSetup && !user && (
            <button
              onClick={() => onNavigate('admin-setup')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded-md hover:bg-amber-200 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Initialize Admin Setup
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2 relative">
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span className="max-w-[120px] truncate">{user.fullName}</span>
                  {user.role === 'admin' && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-slate-900 text-amber-300 rounded font-bold">
                      ADMIN
                    </span>
                  )}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 text-xs">
                      <p className="font-semibold text-slate-900">{user.fullName}</p>
                      <p className="text-slate-500 truncate">{user.email}</p>
                    </div>

                    {user.role === 'admin' ? (
                      <button
                        onClick={() => {
                          onNavigate('admin-dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                        Admin Dashboard
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            onNavigate('applicant-dashboard');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Compass className="w-3.5 h-3.5 text-slate-500" />
                          My Applications
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('applicant-settings');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          Account Settings
                        </button>
                      </>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          onNavigate('landing');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                Register Account
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => {
              onNavigate('landing');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-700 font-medium"
          >
            Advisory Services
          </button>
          <button
            onClick={() => {
              onNavigate('categories');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-700 font-medium"
          >
            Visa Categories
          </button>
          <button
            onClick={() => {
              onNavigate('process');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-700 font-medium"
          >
            Application Workflow
          </button>
          <button
            onClick={() => {
              onNavigate('payments-info');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-700 font-medium"
          >
            Manual Payment Guide
          </button>

          {user && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'applicant-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm font-semibold text-slate-900"
              >
                {user.role === 'admin' ? 'Administrative Dashboard' : 'Applicant Dashboard'}
              </button>
            </div>
          )}

          {needsAdminSetup && !user && (
            <button
              onClick={() => {
                onNavigate('admin-setup');
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-xs font-semibold text-amber-900 bg-amber-50 rounded-lg border border-amber-200 mt-2"
            >
              Initialize Administrator
            </button>
          )}
        </div>
      )}
    </header>
  );
};
