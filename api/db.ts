import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import type {
  User,
  VisaApplication,
  PaymentMethod,
  PaymentSubmission,
  Conversation,
  Notification,
  AuditLog,
  SystemSettings,
} from '../src/types';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

let supabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
    console.log('[Supabase] Initialized with remote project:', SUPABASE_URL);
  } catch (err) {
    console.error('[Supabase] Initialization failed, falling back to local store:', err);
    supabaseClient = null;
  }
}

// Local File Store Fallback (used when Supabase keys are not set in environment)
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export interface LocalUser extends User {
  passwordHash: string;
  salt: string;
  resetToken?: string;
  verificationCode?: string;
}

interface LocalDatabase {
  users: LocalUser[];
  applications: VisaApplication[];
  paymentMethods: PaymentMethod[];
  payments: PaymentSubmission[];
  conversations: Conversation[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const defaultSettings: SystemSettings = {
  websiteName: 'Beacon & Harbor U.S. Visa Advisory Group',
  supportEmail: 'advisory@beaconharbor-visa.com',
  supportPhone: '+1 (202) 847-9201',
  officeAddress: '1200 Pennsylvania Ave NW, Suite 800, Washington, D.C. 20004',
  disclaimerNotice:
    'Beacon & Harbor provides premier visa application assistance, document verification, and procedural advisory services.',
  announcementTitle: 'Advisory Bulletin: DS-160 & Consular Interview Scheduling Slots',
  announcementText:
    'Please note that consular interview wait times vary by post. Ensure all supporting bank statements and invitation letters are uploaded at least 14 days before your designated submission window.',
  isAnnouncementActive: true,
  termsAndConditions:
    '1. Scope of Services: Beacon & Harbor provides administrative document review, procedural guidance, and application management services. We do not guarantee visa approval.\n2. Manual Payment Policy: All application support service fees must be remitted via manual bank wire/transfer to the verified corporate accounts designated in the portal.\n3. Confidentiality: All client records and uploaded travel credentials are encrypted and held in strict compliance with international privacy protocols.',
  privacyPolicy:
    'We collect applicant passport details, employment backgrounds, and financial proofs solely to evaluate visa eligibility and prepare compliant filings. Client documentation is retained under strict access controls and is never monetized or sold to third parties.',
};

const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm-chase-primary',
    label: 'Primary Corporate Wire & ACH Account',
    bankName: 'JPMorgan Chase Bank, N.A.',
    accountName: 'Beacon & Harbor Visa Advisory Group LLC',
    accountNumber: '984021948201',
    swiftOrRouting: 'Routing: 021000021 / SWIFT: CHASUS33',
    instructions:
      'Please initiate a domestic ACH or international wire transfer. CRITICAL: Include your Application Reference Number in the transfer memo or reference field. After transfer completion, take a clear screenshot or save the bank PDF advice and upload it below.',
    isActive: true,
    visaFees: {
      B1_B2: 240,
      F1: 290,
      J1: 275,
      H1B: 480,
      OTHER: 320,
    },
  },
  {
    id: 'pm-bofa-secondary',
    label: 'Secondary Escrow & International Processing',
    bankName: 'Bank of America, N.A.',
    accountName: 'Beacon & Harbor Global Advisory Operations',
    accountNumber: '442088194029',
    swiftOrRouting: 'Routing: 054000030 / SWIFT: BOFAUS3N',
    instructions:
      'Direct branch deposit or SWIFT international wire transfer. Reference your Full Legal Name and Application Number on the deposit receipt.',
    isActive: true,
    visaFees: {
      B1_B2: 240,
      F1: 290,
      J1: 275,
      H1B: 480,
      OTHER: 320,
    },
  },
];

function loadLocalDb(): LocalDatabase {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      return {
        users: data.users || [],
        applications: data.applications || [],
        paymentMethods:
          data.paymentMethods && data.paymentMethods.length > 0 ? data.paymentMethods : defaultPaymentMethods,
        payments: data.payments || [],
        conversations: data.conversations || [],
        notifications: data.notifications || [],
        auditLogs: data.auditLogs || [],
        settings: data.settings ? { ...defaultSettings, ...data.settings } : defaultSettings,
      };
    } catch (e) {
      console.error('Error reading local db.json:', e);
    }
  }

  const initialDb: LocalDatabase = {
    users: [],
    applications: [],
    paymentMethods: defaultPaymentMethods,
    payments: [],
    conversations: [],
    notifications: [],
    auditLogs: [],
    settings: defaultSettings,
  };
  saveLocalDb(initialDb);
  return initialDb;
}

function saveLocalDb(db: LocalDatabase) {
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    // In serverless read-only filesystem, ignore disk write errors
  }
}

let localDb = loadLocalDb();

// ======================== SUPABASE REPOSITORY METHODS ========================

export const dbService = {
  // USERS
  async hasAnyAdmin(): Promise<boolean> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      if (!error && data) return data.length > 0;
    }
    return localDb.users.some((u) => u.role === 'admin');
  },

  async getUserByEmail(email: string): Promise<LocalUser | null> {
    const normalized = email.trim().toLowerCase();
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', normalized)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          phone: data.phone,
          countryOfResidence: data.country_of_residence,
          role: data.role,
          emailVerified: data.email_verified,
          isRootAdmin: data.is_root_admin,
          passwordHash: data.password_hash,
          salt: data.salt,
          resetToken: data.reset_token,
          verificationCode: data.verification_code,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }
    return localDb.users.find((u) => u.email === normalized) || null;
  },

  async getUserById(id: string): Promise<LocalUser | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          phone: data.phone,
          countryOfResidence: data.country_of_residence,
          role: data.role,
          emailVerified: data.email_verified,
          isRootAdmin: data.is_root_admin,
          passwordHash: data.password_hash,
          salt: data.salt,
          resetToken: data.reset_token,
          verificationCode: data.verification_code,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }
    return localDb.users.find((u) => u.id === id) || null;
  },

  async createUser(user: LocalUser): Promise<LocalUser> {
    if (supabaseClient) {
      await supabaseClient.from('users').insert({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        phone: user.phone,
        country_of_residence: user.countryOfResidence,
        role: user.role,
        email_verified: user.emailVerified,
        is_root_admin: user.isRootAdmin || false,
        password_hash: user.passwordHash,
        salt: user.salt,
        reset_token: user.resetToken,
        verification_code: user.verificationCode,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      });
    }
    localDb.users.push(user);
    saveLocalDb(localDb);
    return user;
  },

  async updateUser(id: string, updates: Partial<LocalUser>): Promise<LocalUser | null> {
    if (supabaseClient) {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.countryOfResidence !== undefined) payload.country_of_residence = updates.countryOfResidence;
      if (updates.emailVerified !== undefined) payload.email_verified = updates.emailVerified;
      if (updates.passwordHash !== undefined) payload.password_hash = updates.passwordHash;
      if (updates.salt !== undefined) payload.salt = updates.salt;
      if (updates.resetToken !== undefined) payload.reset_token = updates.resetToken;
      if (updates.verificationCode !== undefined) payload.verification_code = updates.verificationCode;

      await supabaseClient.from('users').update(payload).eq('id', id);
    }
    const user = localDb.users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date().toISOString() });
      saveLocalDb(localDb);
      return user;
    }
    return null;
  },

  async getAllApplicants(): Promise<LocalUser[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('users').select('*').eq('role', 'applicant');
      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          email: d.email,
          fullName: d.full_name,
          phone: d.phone,
          countryOfResidence: d.country_of_residence,
          role: d.role,
          emailVerified: d.email_verified,
          isRootAdmin: d.is_root_admin,
          passwordHash: d.password_hash,
          salt: d.salt,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }
    return localDb.users.filter((u) => u.role === 'applicant');
  },

  // APPLICATIONS
  async getApplications(options: {
    userId?: string;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<VisaApplication[]> {
    if (supabaseClient) {
      let query = supabaseClient.from('applications').select('*');
      if (options.userId) query = query.eq('user_id', options.userId);
      if (options.status && options.status !== 'all') query = query.eq('status', options.status);
      if (options.category && options.category !== 'all') query = query.eq('visa_category', options.category);
      if (options.search) {
        query = query.or(
          `reference_number.ilike.%${options.search}%,applicant_name.ilike.%${options.search}%,applicant_email.ilike.%${options.search}%`
        );
      }
      query = query.order('updated_at', { ascending: false });
      const { data, error } = await query;
      if (!error && data) {
        return data.map((a) => ({
          id: a.id,
          referenceNumber: a.reference_number,
          userId: a.user_id,
          applicantName: a.applicant_name,
          applicantEmail: a.applicant_email,
          visaCategory: a.visa_category,
          status: a.status,
          statusHistory: a.status_history || [],
          feeAmount: Number(a.fee_amount),
          paymentStatus: a.payment_status,
          paymentId: a.payment_id,
          personalInfo: a.personal_info || {},
          passportInfo: a.passport_info || {},
          travelInfo: a.travel_info || {},
          additionalInfo: a.additional_info || {},
          documents: a.documents || [],
          requestedDocumentsNote: a.requested_documents_note,
          adminNotes: a.admin_notes || [],
          rejectionReason: a.rejection_reason,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          submittedAt: a.submitted_at,
        }));
      }
    }

    let list = localDb.applications;
    if (options.userId) list = list.filter((a) => a.userId === options.userId);
    if (options.status && options.status !== 'all') list = list.filter((a) => a.status === options.status);
    if (options.category && options.category !== 'all') list = list.filter((a) => a.visaCategory === options.category);
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.referenceNumber.toLowerCase().includes(q) ||
          a.applicantName.toLowerCase().includes(q) ||
          a.applicantEmail.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getApplicationById(id: string): Promise<VisaApplication | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('applications').select('*').eq('id', id).single();
      if (!error && data) {
        return {
          id: data.id,
          referenceNumber: data.reference_number,
          userId: data.user_id,
          applicantName: data.applicant_name,
          applicantEmail: data.applicant_email,
          visaCategory: data.visa_category,
          status: data.status,
          statusHistory: data.status_history || [],
          feeAmount: Number(data.fee_amount),
          paymentStatus: data.payment_status,
          paymentId: data.payment_id,
          personalInfo: data.personal_info || {},
          passportInfo: data.passport_info || {},
          travelInfo: data.travel_info || {},
          additionalInfo: data.additional_info || {},
          documents: data.documents || [],
          requestedDocumentsNote: data.requested_documents_note,
          adminNotes: data.admin_notes || [],
          rejectionReason: data.rejection_reason,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          submittedAt: data.submitted_at,
        };
      }
    }
    return localDb.applications.find((a) => a.id === id) || null;
  },

  async createApplication(app: VisaApplication): Promise<VisaApplication> {
    if (supabaseClient) {
      await supabaseClient.from('applications').insert({
        id: app.id,
        reference_number: app.referenceNumber,
        user_id: app.userId,
        applicant_name: app.applicantName,
        applicant_email: app.applicantEmail,
        visa_category: app.visaCategory,
        status: app.status,
        status_history: app.statusHistory,
        fee_amount: app.feeAmount,
        payment_status: app.paymentStatus,
        payment_id: app.paymentId,
        personal_info: app.personalInfo,
        passport_info: app.passportInfo,
        travel_info: app.travelInfo,
        additional_info: app.additionalInfo,
        documents: app.documents,
        requested_documents_note: app.requestedDocumentsNote,
        admin_notes: app.adminNotes || [],
        rejection_reason: app.rejectionReason,
        created_at: app.createdAt,
        updated_at: app.updatedAt,
        submitted_at: app.submittedAt,
      });
    }
    localDb.applications.push(app);
    saveLocalDb(localDb);
    return app;
  },

  async updateApplication(id: string, updates: Partial<VisaApplication>): Promise<VisaApplication | null> {
    const existing = await this.getApplicationById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    if (supabaseClient) {
      await supabaseClient
        .from('applications')
        .update({
          visa_category: merged.visaCategory,
          status: merged.status,
          status_history: merged.statusHistory,
          fee_amount: merged.feeAmount,
          payment_status: merged.paymentStatus,
          payment_id: merged.paymentId,
          personal_info: merged.personalInfo,
          passport_info: merged.passportInfo,
          travel_info: merged.travelInfo,
          additional_info: merged.additionalInfo,
          documents: merged.documents,
          requested_documents_note: merged.requestedDocumentsNote,
          admin_notes: merged.adminNotes,
          rejection_reason: merged.rejectionReason,
          updated_at: merged.updatedAt,
          submitted_at: merged.submittedAt,
        })
        .eq('id', id);
    }

    const idx = localDb.applications.findIndex((a) => a.id === id);
    if (idx !== -1) {
      localDb.applications[idx] = merged;
      saveLocalDb(localDb);
    }
    return merged;
  },

  // PAYMENT METHODS
  async getPaymentMethods(onlyActive: boolean = false): Promise<PaymentMethod[]> {
    if (supabaseClient) {
      let q = supabaseClient.from('payment_methods').select('*');
      if (onlyActive) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (!error && data) {
        return data.map((m) => ({
          id: m.id,
          label: m.label,
          bankName: m.bank_name,
          accountName: m.account_name,
          accountNumber: m.account_number,
          swiftOrRouting: m.swift_or_routing,
          instructions: m.instructions,
          isActive: m.is_active,
          visaFees: m.visa_fees || { B1_B2: 240, F1: 290, J1: 275, H1B: 480, OTHER: 320 },
        }));
      }
    }
    if (onlyActive) return localDb.paymentMethods.filter((p) => p.isActive);
    return localDb.paymentMethods;
  },

  async savePaymentMethod(method: PaymentMethod): Promise<PaymentMethod[]> {
    if (supabaseClient) {
      await supabaseClient.from('payment_methods').upsert({
        id: method.id,
        label: method.label,
        bank_name: method.bankName,
        account_name: method.accountName,
        account_number: method.accountNumber,
        swift_or_routing: method.swiftOrRouting,
        instructions: method.instructions,
        is_active: method.isActive,
        visa_fees: method.visaFees,
      });
    }
    const idx = localDb.paymentMethods.findIndex((p) => p.id === method.id);
    if (idx !== -1) {
      localDb.paymentMethods[idx] = method;
    } else {
      localDb.paymentMethods.push(method);
    }
    saveLocalDb(localDb);
    return this.getPaymentMethods();
  },

  async deletePaymentMethod(id: string): Promise<PaymentMethod[]> {
    if (supabaseClient) {
      await supabaseClient.from('payment_methods').delete().eq('id', id);
    }
    localDb.paymentMethods = localDb.paymentMethods.filter((p) => p.id !== id);
    saveLocalDb(localDb);
    return this.getPaymentMethods();
  },

  // PAYMENTS
  async getPayments(applicantId?: string): Promise<PaymentSubmission[]> {
    if (supabaseClient) {
      let q = supabaseClient.from('payments').select('*');
      if (applicantId) q = q.eq('applicant_id', applicantId);
      q = q.order('submitted_at', { ascending: false });
      const { data, error } = await q;
      if (!error && data) {
        return data.map((p) => ({
          id: p.id,
          referenceNumber: p.reference_number,
          applicationId: p.application_id,
          applicationRef: p.application_ref,
          applicantId: p.applicant_id,
          applicantName: p.applicant_name,
          applicantEmail: p.applicant_email,
          visaCategory: p.visa_category,
          amount: Number(p.amount),
          currency: p.currency,
          paymentMethodId: p.payment_method_id,
          bankName: p.bank_name,
          accountName: p.account_name,
          accountNumber: p.account_number,
          transactionReference: p.transaction_reference,
          paymentDate: p.payment_date,
          receiptFileUrl: p.receipt_file_url,
          receiptFileName: p.receipt_file_name,
          status: p.status,
          adminNotes: p.admin_notes,
          verifiedBy: p.verified_by,
          verifiedAt: p.verified_at,
          submittedAt: p.submitted_at,
        }));
      }
    }
    if (applicantId) return localDb.payments.filter((p) => p.applicantId === applicantId);
    return localDb.payments;
  },

  async getPaymentById(id: string): Promise<PaymentSubmission | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('payments').select('*').eq('id', id).single();
      if (!error && data) {
        return {
          id: data.id,
          referenceNumber: data.reference_number,
          applicationId: data.application_id,
          applicationRef: data.application_ref,
          applicantId: data.applicant_id,
          applicantName: data.applicant_name,
          applicantEmail: data.applicant_email,
          visaCategory: data.visa_category,
          amount: Number(data.amount),
          currency: data.currency,
          paymentMethodId: data.payment_method_id,
          bankName: data.bank_name,
          accountName: data.account_name,
          accountNumber: data.account_number,
          transactionReference: data.transaction_reference,
          paymentDate: data.payment_date,
          receiptFileUrl: data.receipt_file_url,
          receiptFileName: data.receipt_file_name,
          status: data.status,
          adminNotes: data.admin_notes,
          verifiedBy: data.verified_by,
          verifiedAt: data.verified_at,
          submittedAt: data.submitted_at,
        };
      }
    }
    return localDb.payments.find((p) => p.id === id) || null;
  },

  async createPayment(payment: PaymentSubmission): Promise<PaymentSubmission> {
    if (supabaseClient) {
      await supabaseClient.from('payments').insert({
        id: payment.id,
        reference_number: payment.referenceNumber,
        application_id: payment.applicationId,
        application_ref: payment.applicationRef,
        applicant_id: payment.applicantId,
        applicant_name: payment.applicantName,
        applicant_email: payment.applicantEmail,
        visa_category: payment.visaCategory,
        amount: payment.amount,
        currency: payment.currency,
        payment_method_id: payment.paymentMethodId,
        bank_name: payment.bankName,
        account_name: payment.accountName,
        account_number: payment.accountNumber,
        transaction_reference: payment.transactionReference,
        payment_date: payment.paymentDate,
        receipt_file_url: payment.receiptFileUrl,
        receipt_file_name: payment.receiptFileName,
        status: payment.status,
        submitted_at: payment.submittedAt,
      });
    }
    localDb.payments.unshift(payment);
    saveLocalDb(localDb);
    return payment;
  },

  async updatePayment(id: string, updates: Partial<PaymentSubmission>): Promise<PaymentSubmission | null> {
    const existing = await this.getPaymentById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };

    if (supabaseClient) {
      await supabaseClient
        .from('payments')
        .update({
          status: merged.status,
          admin_notes: merged.adminNotes,
          verified_by: merged.verifiedBy,
          verified_at: merged.verifiedAt,
        })
        .eq('id', id);
    }
    const idx = localDb.payments.findIndex((p) => p.id === id);
    if (idx !== -1) {
      localDb.payments[idx] = merged;
      saveLocalDb(localDb);
    }
    return merged;
  },

  // CONVERSATIONS
  async getConversations(search?: string): Promise<Conversation[]> {
    if (supabaseClient) {
      let q = supabaseClient.from('conversations').select('*').order('last_message_at', { ascending: false });
      const { data, error } = await q;
      if (!error && data) {
        let list: Conversation[] = data.map((c) => ({
          id: c.id,
          applicantId: c.applicant_id,
          applicantName: c.applicant_name,
          applicantEmail: c.applicant_email,
          applicationId: c.application_id,
          applicationRef: c.application_ref,
          status: c.status,
          unreadByAdmin: c.unread_by_admin || 0,
          unreadByApplicant: c.unread_by_applicant || 0,
          lastMessageAt: c.last_message_at,
          lastMessageText: c.last_message_text,
          messages: c.messages || [],
        }));
        if (search) {
          const s = search.toLowerCase();
          list = list.filter(
            (c) =>
              c.applicantName.toLowerCase().includes(s) ||
              c.applicantEmail.toLowerCase().includes(s) ||
              (c.applicationRef && c.applicationRef.toLowerCase().includes(s))
          );
        }
        return list;
      }
    }

    let list = localDb.conversations;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.applicantName.toLowerCase().includes(s) ||
          c.applicantEmail.toLowerCase().includes(s) ||
          (c.applicationRef && c.applicationRef.toLowerCase().includes(s))
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  },

  async getConversationById(id: string): Promise<Conversation | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('conversations').select('*').eq('id', id).single();
      if (!error && data) {
        return {
          id: data.id,
          applicantId: data.applicant_id,
          applicantName: data.applicant_name,
          applicantEmail: data.applicant_email,
          applicationId: data.application_id,
          applicationRef: data.application_ref,
          status: data.status,
          unreadByAdmin: data.unread_by_admin || 0,
          unreadByApplicant: data.unread_by_applicant || 0,
          lastMessageAt: data.last_message_at,
          lastMessageText: data.last_message_text,
          messages: data.messages || [],
        };
      }
    }
    return localDb.conversations.find((c) => c.id === id) || null;
  },

  async saveConversation(conv: Conversation): Promise<Conversation> {
    if (supabaseClient) {
      await supabaseClient.from('conversations').upsert({
        id: conv.id,
        applicant_id: conv.applicantId,
        applicant_name: conv.applicantName,
        applicant_email: conv.applicantEmail,
        application_id: conv.applicationId,
        application_ref: conv.applicationRef,
        status: conv.status,
        unread_by_admin: conv.unreadByAdmin,
        unread_by_applicant: conv.unreadByApplicant,
        last_message_at: conv.lastMessageAt,
        last_message_text: conv.lastMessageText,
        messages: conv.messages,
      });
    }
    const idx = localDb.conversations.findIndex((c) => c.id === conv.id);
    if (idx !== -1) {
      localDb.conversations[idx] = conv;
    } else {
      localDb.conversations.push(conv);
    }
    saveLocalDb(localDb);
    return conv;
  },

  // NOTIFICATIONS
  async getNotifications(userId: string): Promise<Notification[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((n) => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          link: n.link,
          isRead: n.is_read,
          createdAt: n.created_at,
        }));
      }
    }
    return localDb.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createNotification(notif: Notification): Promise<Notification> {
    if (supabaseClient) {
      await supabaseClient.from('notifications').insert({
        id: notif.id,
        user_id: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        link: notif.link,
        is_read: notif.isRead,
        created_at: notif.createdAt,
      });
    }
    localDb.notifications.unshift(notif);
    saveLocalDb(localDb);
    return notif;
  },

  async markNotificationRead(id: string): Promise<void> {
    if (supabaseClient) {
      await supabaseClient.from('notifications').update({ is_read: true }).eq('id', id);
    }
    const n = localDb.notifications.find((notif) => notif.id === id);
    if (n) {
      n.isRead = true;
      saveLocalDb(localDb);
    }
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (supabaseClient) {
      await supabaseClient.from('notifications').update({ is_read: true }).eq('user_id', userId);
    }
    localDb.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    saveLocalDb(localDb);
  },

  // AUDIT LOGS
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (!error && data) {
        return data.map((l) => ({
          id: l.id,
          timestamp: l.timestamp,
          adminId: l.admin_id,
          adminName: l.admin_name,
          action: l.action,
          targetType: l.target_type,
          targetId: l.target_id,
          details: l.details,
        }));
      }
    }
    return localDb.auditLogs.slice(0, limit);
  },

  async createAuditLog(log: AuditLog): Promise<void> {
    if (supabaseClient) {
      await supabaseClient.from('audit_logs').insert({
        id: log.id,
        timestamp: log.timestamp,
        admin_id: log.adminId,
        admin_name: log.adminName,
        action: log.action,
        target_type: log.targetType,
        target_id: log.targetId,
        details: log.details,
      });
    }
    localDb.auditLogs.unshift(log);
    if (localDb.auditLogs.length > 500) localDb.auditLogs.pop();
    saveLocalDb(localDb);
  },

  // SETTINGS
  async getSettings(): Promise<SystemSettings> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (!error && data) {
        return {
          websiteName: data.website_name,
          supportEmail: data.support_email,
          supportPhone: data.supportphone,
          officeAddress: data.office_address,
          disclaimerNotice: data.disclaimer_notice,
          announcementTitle: data.announcement_title,
          announcementText: data.announcement_text,
          isAnnouncementActive: data.is_announcement_active,
          termsAndConditions: data.terms_and_conditions,
          privacyPolicy: data.privacy_policy,
        };
      }
    }
    return localDb.settings;
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const merged = { ...localDb.settings, ...settings };
    if (supabaseClient) {
      await supabaseClient.from('system_settings').upsert({
        id: 1,
        website_name: merged.websiteName,
        support_email: merged.supportEmail,
        supportphone: merged.supportPhone,
        office_address: merged.officeAddress,
        disclaimer_notice: merged.disclaimerNotice,
        announcement_title: merged.announcementTitle,
        announcement_text: merged.announcementText,
        is_announcement_active: merged.isAnnouncementActive,
        terms_and_conditions: merged.termsAndConditions,
        privacy_policy: merged.privacyPolicy,
        updated_at: new Date().toISOString(),
      });
    }
    localDb.settings = merged;
    saveLocalDb(localDb);
    return merged;
  },

  // STORAGE (Supabase Storage with fallback to local disk)
  async uploadFile(
    filename: string,
    mimeType: string,
    buffer: Buffer
  ): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
    const ext = path.extname(filename) || (mimeType.includes('pdf') ? '.pdf' : '.jpg');
    const safeKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    // If Supabase Storage is configured, upload to 'visa-documents' bucket
    if (supabaseClient) {
      try {
        const { error: uploadError } = await supabaseClient.storage
          .from('visa-documents')
          .upload(safeKey, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data } = supabaseClient.storage.from('visa-documents').getPublicUrl(safeKey);
          if (data?.publicUrl) {
            return {
              url: data.publicUrl,
              fileName: filename,
              fileSize: buffer.length,
              mimeType,
            };
          }
        } else {
          console.warn('[Supabase Storage] Upload error, falling back:', uploadError);
        }
      } catch (storageErr) {
        console.warn('[Supabase Storage] Exception:', storageErr);
      }
    }

    // Local Disk Fallback
    try {
      const filePath = path.join(UPLOADS_DIR, safeKey);
      fs.writeFileSync(filePath, buffer);
    } catch {
      // Ignore if read-only Vercel tmp, base64 url can be generated or returned
    }

    return {
      url: `/api/files/${safeKey}`,
      fileName: filename,
      fileSize: buffer.length,
      mimeType,
    };
  },
};
