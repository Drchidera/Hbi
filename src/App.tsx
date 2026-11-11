import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './lib/api';
import type { VisaApplication, SystemSettings, VisaCategory } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { StaticViews } from './components/pages/StaticViews';
import { ApplicantDashboard } from './components/applicant/ApplicantDashboard';
import { ApplicantSettings } from './components/applicant/ApplicantSettings';
import { ApplicationWizard } from './components/applicant/ApplicationWizard';
import { PaymentModal } from './components/applicant/PaymentModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminSetupModal } from './components/admin/AdminSetupModal';
import { AuthModal } from './components/auth/AuthModal';
import { ChatBox } from './components/chat/ChatBox';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { LegalModal } from './components/legal/LegalModal';

function MainApp() {
  const { user, needsAdminSetup, checkAdminSetup } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('landing');

  // Modals & Drawers
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [adminSetupModalOpen, setAdminSetupModalOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardCategory, setWizardCategory] = useState<VisaCategory>('B1_B2');
  const [editingApplication, setEditingApplication] = useState<VisaApplication | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetApp, setPaymentTargetApp] = useState<VisaApplication | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  // System settings
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const handleStartApplication = (category: VisaCategory = 'B1_B2') => {
    if (!user) {
      setAuthMode('register');
      setAuthModalOpen(true);
      return;
    }
    setWizardCategory(category);
    setEditingApplication(null);
    setWizardOpen(true);
  };

  const handleTrackApplication = () => {
    if (!user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    setCurrentView('applicant-dashboard');
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin-setup') {
            setAdminSetupModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        onOpenAuth={handleOpenAuth}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* 3. Main Body Routing */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            settings={settings}
            onStartApplication={handleStartApplication}
            onTrackApplication={handleTrackApplication}
            onOpenAuth={handleOpenAuth}
            onOpenPaymentsGuide={() => setCurrentView('payments-info')}
          />
        )}

        {(currentView === 'categories' || currentView === 'process' || currentView === 'payments-info') && (
          <StaticViews
            view={currentView as any}
            onStartApplication={handleStartApplication}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentView === 'applicant-dashboard' && (
          <ApplicantDashboard
            onStartNewApplication={() => handleStartApplication('B1_B2')}
            onOpenChat={() => setChatOpen(true)}
            onOpenSettings={() => setCurrentView('applicant-settings')}
            onOpenNotifications={() => setNotificationsOpen(true)}
          />
        )}

        {currentView === 'applicant-settings' && <ApplicantSettings />}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard onOpenChat={() => setChatOpen(true)} />
        )}
      </main>

      {/* 4. Footer */}
      <Footer
        onOpenPolicy={(type) => setLegalModalType(type)}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* MODALS */}
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          // After login, navigate to appropriate dashboard
          if (user?.role === 'admin') {
            setCurrentView('admin-dashboard');
          } else {
            setCurrentView('applicant-dashboard');
          }
        }}
      />

      {/* Admin Setup Wizard */}
      <AdminSetupModal
        isOpen={adminSetupModalOpen}
        onClose={() => setAdminSetupModalOpen(false)}
        onSuccess={() => {
          setCurrentView('admin-dashboard');
        }}
      />

      {/* Application Multi-Step Wizard */}
      {wizardOpen && (
        <ApplicationWizard
          initialCategory={wizardCategory}
          existingApplication={editingApplication}
          onClose={() => setWizardOpen(false)}
          onSuccess={(app) => {
            setWizardOpen(false);
            setCurrentView('applicant-dashboard');
          }}
          onProceedToPayment={(app) => {
            setWizardOpen(false);
            setPaymentTargetApp(app);
            setPaymentModalOpen(true);
          }}
        />
      )}

      {/* Payment Modal */}
      {paymentModalOpen && paymentTargetApp && (
        <PaymentModal
          application={paymentTargetApp}
          isOpen={true}
          onClose={() => {
            setPaymentModalOpen(false);
            setPaymentTargetApp(null);
          }}
          onPaymentSubmitted={() => {
            setCurrentView('applicant-dashboard');
          }}
        />
      )}

      {/* Chat Support Drawer */}
      <ChatBox
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        isAdminMode={user?.role === 'admin'}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* Legal & Privacy Policy Modal */}
      <LegalModal
        type={legalModalType}
        settings={settings}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
