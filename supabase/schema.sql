-- =====================================================================
-- Beacon & Harbor U.S. Visa Advisory Portal
-- Supabase PostgreSQL Schema & Row Level Security (RLS) Setup
-- =====================================================================

-- 1. Enable UUID Extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  country_of_residence TEXT,
  role TEXT NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant', 'admin')),
  email_verified BOOLEAN DEFAULT FALSE,
  is_root_admin BOOLEAN DEFAULT FALSE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  reset_token TEXT,
  verification_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 3. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  visa_category TEXT NOT NULL CHECK (visa_category IN ('B1_B2', 'F1', 'J1', 'H1B', 'OTHER')),
  status TEXT NOT NULL DEFAULT 'Draft',
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  fee_amount NUMERIC(10,2) NOT NULL DEFAULT 240.00,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'under_review', 'confirmed', 'rejected')),
  payment_id TEXT,
  personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  passport_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  travel_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  additional_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  requested_documents_note TEXT,
  admin_notes JSONB DEFAULT '[]'::jsonb,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_ref ON public.applications(reference_number);

-- 4. PAYMENT METHODS TABLE (Admin Controlled)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  swift_or_routing TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  visa_fees JSONB NOT NULL DEFAULT '{"B1_B2": 240, "F1": 290, "J1": 275, "H1B": 480, "OTHER": 320}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENTS TABLE (Manual Bank Wire Records)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  application_ref TEXT NOT NULL,
  applicant_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  visa_category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method_id TEXT,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  transaction_reference TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  receipt_file_url TEXT NOT NULL,
  receipt_file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'confirmed', 'rejected', 'receipt_re-requested')),
  admin_notes TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_applicant_id ON public.payments(applicant_id);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON public.payments(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 6. CONVERSATIONS & CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  applicant_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  application_id TEXT,
  application_ref TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  unread_by_admin INTEGER DEFAULT 0,
  unread_by_applicant INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_text TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_conversations_applicant_id ON public.conversations(applicant_id);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 9. SYSTEM SETTINGS TABLE (Single row)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  website_name TEXT NOT NULL DEFAULT 'Beacon & Harbor U.S. Visa Advisory Group',
  support_email TEXT NOT NULL DEFAULT 'advisory@beaconharbor-visa.com',
  supportPhone TEXT NOT NULL DEFAULT '+1 (202) 847-9201',
  office_address TEXT NOT NULL DEFAULT '1200 Pennsylvania Ave NW, Suite 800, Washington, D.C. 20004',
  disclaimer_notice TEXT DEFAULT 'Beacon & Harbor provides premier visa application assistance, document verification, and procedural advisory services.',
  announcement_title TEXT DEFAULT 'Advisory Bulletin: DS-160 & Consular Interview Scheduling Slots',
  announcement_text TEXT DEFAULT 'Please note that consular interview wait times vary by post. Ensure all supporting bank statements and invitation letters are uploaded at least 14 days before your designated submission window.',
  is_announcement_active BOOLEAN DEFAULT TRUE,
  terms_and_conditions TEXT,
  privacy_policy TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DEFAULT SEEDS (Only inserted if not present)
INSERT INTO public.system_settings (id, website_name, support_email, supportPhone, office_address, terms_and_conditions, privacy_policy)
VALUES (
  1,
  'Beacon & Harbor U.S. Visa Advisory Group',
  'advisory@beaconharbor-visa.com',
  '+1 (202) 847-9201',
  '1200 Pennsylvania Ave NW, Suite 800, Washington, D.C. 20004',
  '1. Scope of Services: Beacon & Harbor provides administrative document review, procedural guidance, and application management services. We do not guarantee visa approval.\n2. Manual Payment Policy: All application support service fees must be remitted via manual bank wire/transfer to the verified corporate accounts designated in the portal.\n3. Confidentiality: All client records and uploaded travel credentials are encrypted and held in strict compliance with international privacy protocols.',
  'We collect applicant passport details, employment backgrounds, and financial proofs solely to evaluate visa eligibility and prepare compliant filings. Client documentation is retained under strict access controls and is never monetized or sold to third parties.'
)
ON CONFLICT (id) DO NOTHING;

-- Default Bank Accounts
INSERT INTO public.payment_methods (id, label, bank_name, account_name, account_number, swift_or_routing, instructions, is_active, visa_fees)
VALUES
(
  'pm-chase-primary',
  'Primary Corporate Wire & ACH Account',
  'JPMorgan Chase Bank, N.A.',
  'Beacon & Harbor Visa Advisory Group LLC',
  '984021948201',
  'Routing: 021000021 / SWIFT: CHASUS33',
  'Please initiate a domestic ACH or international wire transfer. CRITICAL: Include your Application Reference Number in the transfer memo or reference field. After transfer completion, upload your bank transfer confirmation slip or receipt below.',
  true,
  '{"B1_B2": 240, "F1": 290, "J1": 275, "H1B": 480, "OTHER": 320}'::jsonb
),
(
  'pm-bofa-secondary',
  'Secondary Escrow & International Processing',
  'Bank of America, N.A.',
  'Beacon & Harbor Global Advisory Operations',
  '442088194029',
  'Routing: 054000030 / SWIFT: BOFAUS3N',
  'Direct branch deposit or SWIFT international wire transfer. Reference your Full Legal Name and Application Number on the deposit receipt.',
  true,
  '{"B1_B2": 240, "F1": 290, "J1": 275, "H1B": 480, "OTHER": 320}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed Root Admin Account (Email: deratechs@gmail.com, Password: Akuoma070@)
INSERT INTO public.users (id, email, full_name, phone, country_of_residence, role, email_verified, is_root_admin, password_hash, salt)
VALUES (
  'admin-root',
  'deratechs@gmail.com',
  'Administrator',
  '+1 (202) 847-9201',
  'United States',
  'admin',
  true,
  true,
  -- Precomputed scrypt hash for Akuoma070@
  '8d34346eb0e527d91e3e7f9eb42b3252ae8c9a38a74e54e0b0292ffaa046ec397aa2c7653bb3298816c1cece804bf16b8da46cfbe6a72ef0139988e0ebc5c300',
  '24874c7db819777174ee0f33989c09aa'
)
ON CONFLICT (email) DO NOTHING;

-- 11. SUPABASE STORAGE BUCKET CONFIGURATION
-- Run in Supabase SQL editor to create storage bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('visa-documents', 'visa-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Note: The backend API functions connect using the service_role key,
-- bypassing RLS for server-side verification, while direct anon client calls
-- are restricted by the policies below:

CREATE POLICY "Public can read active payment methods"
  ON public.payment_methods FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read system settings"
  ON public.system_settings FOR SELECT USING (id = 1);
