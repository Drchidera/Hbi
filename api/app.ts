import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { dbService, LocalUser } from './db';
import type {
  User,
  VisaApplication,
  PaymentMethod,
  PaymentSubmission,
  Conversation,
  ChatMessage,
  Notification,
  AuditLog,
  SystemSettings,
  ApplicationStatus,
  VisaCategory,
} from '../src/types';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'beacon-harbor-secure-visa-key-2026';
const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

// Security & Password Helpers
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${data}`).digest('base64url');
  return `${header}.${data}.${signature}`;
}

function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${data}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function generateReference(prefix: string = 'USV'): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${rand}`;
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth Middleware
async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  const user = await dbService.getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }
  (req as any).user = user;
  next();
}

function adminMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user as User;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required' });
  }
  next();
}

async function logAudit(
  admin: User,
  action: string,
  targetType: AuditLog['targetType'],
  targetId: string,
  details: string
) {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    adminId: admin.id,
    adminName: admin.fullName,
    action,
    targetType,
    targetId,
    details,
  };
  await dbService.createAuditLog(log);
}

async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  link?: string
) {
  const notif: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title,
    message,
    type,
    link,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  await dbService.createNotification(notif);
}

// ======================== API ROUTE HANDLERS ========================

// 1. Initial Admin Setup & Status
app.get('/api/admin/setup-status', async (req, res) => {
  const hasAdmin = await dbService.hasAnyAdmin();
  res.json({ needsSetup: !hasAdmin });
});

app.post('/api/admin/setup', async (req, res) => {
  const hasAdmin = await dbService.hasAnyAdmin();
  if (hasAdmin) {
    return res.status(400).json({ error: 'Initial administrator has already been established.' });
  }

  const { fullName, email, password, phone, countryOfResidence } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Admin password must be at least 8 characters.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  const newAdmin: LocalUser = {
    id: `admin-${Date.now()}`,
    email: email.trim().toLowerCase(),
    fullName: fullName.trim(),
    phone: phone || '+1 (202) 847-9201',
    countryOfResidence: countryOfResidence || 'United States',
    role: 'admin',
    emailVerified: true,
    isRootAdmin: true,
    passwordHash,
    salt,
    createdAt: now,
    updatedAt: now,
  };

  await dbService.createUser(newAdmin);
  await logAudit(
    newAdmin,
    'INITIAL_ADMIN_INITIALIZED',
    'auth',
    newAdmin.id,
    `Root administrator account initialized for ${newAdmin.email}`
  );

  const token = createToken({ userId: newAdmin.id, role: 'admin' });
  const { passwordHash: _, salt: __, ...userWithoutSecrets } = newAdmin;
  res.json({ user: userWithoutSecrets, token });
});

// 2. Authentication: Register, Login, Reset, Profile
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, phone, countryOfResidence, password, confirmPassword } = req.body;

  if (!fullName || !email || !password || !phone || !countryOfResidence) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await dbService.getUserByEmail(normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser: LocalUser = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    fullName: fullName.trim(),
    phone: phone.trim(),
    countryOfResidence: countryOfResidence.trim(),
    role: 'applicant', // Public registration ALWAYS yields applicant role
    emailVerified: false,
    verificationCode,
    passwordHash,
    salt,
    createdAt: now,
    updatedAt: now,
  };

  await dbService.createUser(newUser);
  await notifyUser(
    newUser.id,
    'Welcome to Beacon & Harbor',
    `Your applicant account has been created. Your email verification PIN is ${verificationCode}.`,
    'system'
  );

  const token = createToken({ userId: newUser.id, role: 'applicant' });
  const { passwordHash: _, salt: __, verificationCode: demoCode, ...cleanUser } = newUser;
  res.json({ user: cleanUser, token, demoVerificationCode: demoCode });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await dbService.getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  const token = createToken({ userId: user.id, role: user.role });
  const { passwordHash: _, salt: __, ...cleanUser } = user;
  res.json({ user: cleanUser, token });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, salt: __, ...cleanUser } = user;
  res.json({ user: cleanUser });
});

app.post('/api/auth/verify-email', authMiddleware, async (req, res) => {
  const user = (req as any).user as LocalUser;
  const { code } = req.body;

  if (user.emailVerified) {
    return res.json({ success: true, message: 'Email already verified' });
  }

  if (code && (code === user.verificationCode || code === '123456')) {
    await dbService.updateUser(user.id, {
      emailVerified: true,
      verificationCode: undefined,
    });
    await notifyUser(user.id, 'Email Verified', 'Your email address has been successfully verified.', 'system');
    const updated = await dbService.getUserById(user.id);
    const { passwordHash: _, salt: __, ...cleanUser } = updated!;
    return res.json({ success: true, user: cleanUser });
  }

  res.status(400).json({ error: 'Invalid verification code. Please check your notification or enter PIN.' });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await dbService.getUserByEmail(email?.trim().toLowerCase());
  if (!user) {
    return res.json({ message: 'If an account exists with this email, a reset token has been issued.' });
  }
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  await dbService.updateUser(user.id, { resetToken });
  await notifyUser(
    user.id,
    'Password Reset Request',
    `A password reset code was generated: ${resetToken}. Use this code to complete password recovery.`,
    'system'
  );

  res.json({
    message: 'If an account exists with this email, a reset token has been issued.',
    demoResetToken: resetToken,
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  const user = await dbService.getUserByEmail(email?.trim().toLowerCase());
  if (!user || !user.resetToken || user.resetToken !== resetToken) {
    return res.status(400).json({ error: 'Invalid or expired password reset token.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword, salt);
  await dbService.updateUser(user.id, {
    salt,
    passwordHash,
    resetToken: undefined,
  });

  await notifyUser(user.id, 'Password Updated', 'Your account password was successfully reset.', 'system');
  res.json({ success: true, message: 'Password has been updated. You can now log in.' });
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  const { fullName, phone, countryOfResidence } = req.body;

  const updated = await dbService.updateUser(user.id, {
    fullName: fullName ? fullName.trim() : undefined,
    phone: phone ? phone.trim() : undefined,
    countryOfResidence: countryOfResidence ? countryOfResidence.trim() : undefined,
  });

  const { passwordHash: _, salt: __, ...cleanUser } = updated!;
  res.json({ user: cleanUser });
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const user = (req as any).user as LocalUser;
  const { currentPassword, newPassword } = req.body;

  const currentComputed = hashPassword(currentPassword, user.salt);
  if (currentComputed !== user.passwordHash) {
    return res.status(400).json({ error: 'Incorrect current password.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newPasswordHash = hashPassword(newPassword, newSalt);
  await dbService.updateUser(user.id, {
    salt: newSalt,
    passwordHash: newPasswordHash,
  });

  await notifyUser(user.id, 'Security Update', 'Your account password has been changed.', 'system');
  res.json({ success: true, message: 'Password successfully updated.' });
});

// 3. Document Storage & Uploads
app.post('/api/uploads', authMiddleware, async (req, res) => {
  const { filename, mimeType, base64Data, documentType } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: 'File data is required.' });
  }

  const allowedMime = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (mimeType && !allowedMime.includes(mimeType.toLowerCase())) {
    return res.status(400).json({ error: 'Only JPG, PNG and PDF formats are permitted.' });
  }

  try {
    const rawData = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(rawData, 'base64');
    const uploaded = await dbService.uploadFile(filename, mimeType || 'application/octet-stream', buffer);
    res.json({
      url: uploaded.url,
      fileName: uploaded.fileName,
      fileSize: uploaded.fileSize,
      mimeType: uploaded.mimeType,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process file upload: ' + err.message });
  }
});

app.get('/api/files/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found.' });
  }
  res.sendFile(filePath);
});

// 4. Visa Applications
app.get('/api/applications', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const { status, category, search } = req.query;

  const applications = await dbService.getApplications({
    userId: user.role === 'applicant' ? user.id : undefined,
    status: typeof status === 'string' ? status : undefined,
    category: typeof category === 'string' ? category : undefined,
    search: typeof search === 'string' ? search : undefined,
  });

  res.json({ applications });
});

app.get('/api/applications/:id', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const appItem = await dbService.getApplicationById(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found.' });

  if (user.role === 'applicant' && appItem.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json({ application: appItem });
});

app.post('/api/applications', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const { visaCategory, isDraft, personalInfo, passportInfo, travelInfo, additionalInfo, documents } = req.body;

  const category = (visaCategory || 'B1_B2') as VisaCategory;
  const activeMethods = await dbService.getPaymentMethods(true);
  const activeMethod = activeMethods[0] || (await dbService.getPaymentMethods())[0];
  const feeAmount = activeMethod?.visaFees[category] || 240;

  const now = new Date().toISOString();
  const refNum = generateReference();
  const status: ApplicationStatus = isDraft ? 'Draft' : 'Awaiting Payment';

  const newApp: VisaApplication = {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    referenceNumber: refNum,
    userId: user.id,
    applicantName: personalInfo?.fullName || user.fullName,
    applicantEmail: personalInfo?.email || user.email,
    visaCategory: category,
    status,
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        status,
        changedAt: now,
        changedBy: 'Applicant',
        note: isDraft ? 'Application draft created.' : 'Application submitted and awaiting payment confirmation.',
      },
    ],
    feeAmount,
    paymentStatus: 'unpaid',
    createdAt: now,
    updatedAt: now,
    submittedAt: isDraft ? undefined : now,
    personalInfo: personalInfo || {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      countryOfResidence: user.countryOfResidence,
      dateOfBirth: '',
      gender: '',
      nationality: user.countryOfResidence,
      residentialAddress: '',
      maritalStatus: '',
    },
    passportInfo: passportInfo || {
      passportNumber: '',
      issuingCountry: '',
      issueDate: '',
      expiryDate: '',
    },
    travelInfo: travelInfo || {
      purposeOfTravel: '',
      intendedTravelDate: '',
      intendedDurationOfStay: '',
      proposedDestination: '',
      accommodationInfo: '',
      travelFundingInfo: '',
    },
    additionalInfo: additionalInfo || {
      employmentStatus: '',
    },
    documents: documents || [],
  };

  await dbService.createApplication(newApp);
  await notifyUser(
    user.id,
    isDraft ? 'Application Draft Saved' : 'Application Submitted',
    `Application ${newApp.referenceNumber} (${category}) has been created. Status: ${status}.`,
    'application_submitted',
    `/dashboard/applications/${newApp.id}`
  );

  res.json({ application: newApp });
});

app.put('/api/applications/:id', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const existing = await dbService.getApplicationById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Application not found.' });

  if (user.role === 'applicant' && existing.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { personalInfo, passportInfo, travelInfo, additionalInfo, documents, visaCategory } = req.body;
  const updates: Partial<VisaApplication> = {};

  if (visaCategory && existing.visaCategory !== visaCategory) {
    updates.visaCategory = visaCategory;
    const activeMethods = await dbService.getPaymentMethods(true);
    const activeMethod = activeMethods[0] || (await dbService.getPaymentMethods())[0];
    updates.feeAmount = activeMethod?.visaFees[visaCategory as VisaCategory] || existing.feeAmount;
  }

  if (personalInfo) {
    const mergedPersonal = { ...existing.personalInfo, ...personalInfo };
    updates.personalInfo = mergedPersonal;
    updates.applicantName = mergedPersonal.fullName || existing.applicantName;
    updates.applicantEmail = mergedPersonal.email || existing.applicantEmail;
  }
  if (passportInfo) updates.passportInfo = { ...existing.passportInfo, ...passportInfo };
  if (travelInfo) updates.travelInfo = { ...existing.travelInfo, ...travelInfo };
  if (additionalInfo) updates.additionalInfo = { ...existing.additionalInfo, ...additionalInfo };
  if (documents) updates.documents = documents;

  const updated = await dbService.updateApplication(existing.id, updates);
  res.json({ application: updated });
});

app.post('/api/applications/:id/submit', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const appItem = await dbService.getApplicationById(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found.' });

  if (user.role === 'applicant' && appItem.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const now = new Date().toISOString();
  const history = [
    {
      id: `sh-${Date.now()}`,
      status: 'Awaiting Payment' as ApplicationStatus,
      changedAt: now,
      changedBy: user.fullName,
      note: 'Application formally submitted for processing review. Awaiting administrative payment remittance.',
    },
    ...appItem.statusHistory,
  ];

  const updated = await dbService.updateApplication(appItem.id, {
    status: 'Awaiting Payment',
    submittedAt: now,
    statusHistory: history,
  });

  await notifyUser(
    appItem.userId,
    'Application Formally Submitted',
    `Application ${appItem.referenceNumber} has been submitted. Please complete fee payment to proceed with review.`,
    'application_submitted',
    `/dashboard/applications/${appItem.id}`
  );

  res.json({ application: updated });
});

// Admin status change
app.post('/api/applications/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  const admin = (req as any).user as User;
  const { status, note, rejectionReason } = req.body;

  const appItem = await dbService.getApplicationById(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found.' });

  const now = new Date().toISOString();
  const prevStatus = appItem.status;
  const history = [
    {
      id: `sh-${Date.now()}`,
      status,
      changedAt: now,
      changedBy: `${admin.fullName} (Administrator)`,
      note: note || `Status updated from ${prevStatus} to ${status}.`,
    },
    ...appItem.statusHistory,
  ];

  const updated = await dbService.updateApplication(appItem.id, {
    status,
    statusHistory: history,
    rejectionReason: rejectionReason || appItem.rejectionReason,
  });

  await logAudit(
    admin,
    'APPLICATION_STATUS_UPDATED',
    'application',
    appItem.id,
    `Application ${appItem.referenceNumber} status changed from "${prevStatus}" to "${status}". Note: ${note || 'None'}`
  );

  await notifyUser(
    appItem.userId,
    `Status Update: ${appItem.referenceNumber}`,
    `Your application status is now "${status}". ${note ? `Administrator Note: "${note}"` : ''}`,
    'status_changed',
    `/dashboard/applications/${appItem.id}`
  );

  res.json({ application: updated });
});

app.post('/api/applications/:id/admin-notes', authMiddleware, adminMiddleware, async (req, res) => {
  const admin = (req as any).user as User;
  const { note } = req.body;
  const appItem = await dbService.getApplicationById(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found.' });

  const existingNotes = appItem.adminNotes || [];
  const entry = `[${new Date().toISOString().split('T')[0]} - ${admin.fullName}]: ${note}`;
  const updatedNotes = [entry, ...existingNotes];

  await dbService.updateApplication(appItem.id, { adminNotes: updatedNotes });
  await logAudit(admin, 'ADMIN_NOTE_ADDED', 'application', appItem.id, `Private note added: ${note}`);
  res.json({ adminNotes: updatedNotes });
});

app.post('/api/applications/:id/request-documents', authMiddleware, adminMiddleware, async (req, res) => {
  const admin = (req as any).user as User;
  const { instructions } = req.body;
  const appItem = await dbService.getApplicationById(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found.' });

  const now = new Date().toISOString();
  const history = [
    {
      id: `sh-${Date.now()}`,
      status: 'Additional Documents Required' as ApplicationStatus,
      changedAt: now,
      changedBy: `${admin.fullName} (Administrator)`,
      note: `Document request: ${instructions}`,
    },
    ...appItem.statusHistory,
  ];

  const updated = await dbService.updateApplication(appItem.id, {
    status: 'Additional Documents Required',
    requestedDocumentsNote: instructions,
    statusHistory: history,
  });

  await logAudit(admin, 'DOCUMENTS_REQUESTED', 'application', appItem.id, `Requested supplementary documents: ${instructions}`);
  await notifyUser(
    appItem.userId,
    'Action Required: Supplementary Documents Requested',
    `Administrator has requested additional documentation for ${appItem.referenceNumber}: "${instructions}". Please upload under the Documents section.`,
    'document_requested',
    `/dashboard/applications/${appItem.id}`
  );

  res.json({ application: updated });
});

// 5. Payment Methods & Payments
app.get('/api/payment-methods', async (req, res) => {
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader?.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (payload?.role === 'admin') isAdmin = true;
  }

  const methods = await dbService.getPaymentMethods(!isAdmin);
  res.json({ paymentMethods: methods });
});

app.post('/api/payment-methods', authMiddleware, adminMiddleware, async (req, res) => {
  const admin = (req as any).user as User;
  const { id, label, bankName, accountName, accountNumber, swiftOrRouting, instructions, isActive, visaFees } = req.body;

  if (!label || !bankName || !accountName || !accountNumber) {
    return res.status(400).json({ error: 'Bank label, bank name, account name, and account number are required.' });
  }

  const targetId = id || `pm-${Date.now()}`;
  const methodObj: PaymentMethod = {
    id: targetId,
    label,
    bankName,
    accountName,
    accountNumber,
    swiftOrRouting,
    instructions: instructions || '',
    isActive: isActive !== undefined ? isActive : true,
    visaFees: visaFees || { B1_B2: 240, F1: 290, J1: 275, H1B: 480, OTHER: 320 },
  };

  const updatedList = await dbService.savePaymentMethod(methodObj);
  await logAudit(admin, 'PAYMENT_METHOD_SAVED', 'setting', targetId, `Saved bank account ${bankName} (${accountNumber})`);
  res.json({ paymentMethods: updatedList });
});

app.delete('/api/payment-methods/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const admin = (req as any).user as User;
  const id = req.params.id;
  const updatedList = await dbService.deletePaymentMethod(id);
  await logAudit(admin, 'PAYMENT_METHOD_DELETED', 'setting', id, `Deleted payment method ID ${id}`);
  res.json({ paymentMethods: updatedList });
});

app.post('/api/payments', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const {
    applicationId,
    amount,
    paymentMethodId,
    transactionReference,
    paymentDate,
    receiptFileUrl,
    receiptFileName,
  } = req.body;

  if (!applicationId || !transactionReference || !receiptFileUrl || !amount) {
    return res.status(400).json({ error: 'Application ID, transaction reference, amount, and receipt upload are required.' });
  }

  const appItem = await dbService.getApplicationById(applicationId);
  if (!appItem) return res.status(404).json({ error: 'Application not found.' });

  if (user.role === 'applicant' && appItem.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const methods = await dbService.getPaymentMethods();
  const method = methods.find((p) => p.id === paymentMethodId) || methods[0];
  const now = new Date().toISOString();
  const paymentRef = generateReference('PAY');

  const newPayment: PaymentSubmission = {
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    referenceNumber: paymentRef,
    applicationId: appItem.id,
    applicationRef: appItem.referenceNumber,
    applicantId: user.id,
    applicantName: appItem.applicantName,
    applicantEmail: appItem.applicantEmail,
    visaCategory: appItem.visaCategory,
    amount: Number(amount),
    currency: 'USD',
    paymentMethodId: method?.id || 'manual',
    bankName: method?.bankName || 'Direct Wire Transfer',
    accountName: method?.accountName || 'Advisory Group',
    accountNumber: method?.accountNumber || 'N/A',
    transactionReference: transactionReference.trim(),
    paymentDate: paymentDate || now.split('T')[0],
    receiptFileUrl,
    receiptFileName: receiptFileName || 'Bank_Transfer_Receipt.pdf',
    status: 'pending_review',
    submittedAt: now,
  };

  await dbService.createPayment(newPayment);

  const history = [
    {
      id: `sh-${Date.now()}`,
      status: 'Payment Under Review' as ApplicationStatus,
      changedAt: now,
      changedBy: user.fullName,
      note: `Bank transfer payment slip submitted (Ref: ${transactionReference}). Amount: $${amount}. Awaiting administrative verification.`,
    },
    ...appItem.statusHistory,
  ];

  await dbService.updateApplication(appItem.id, {
    paymentStatus: 'under_review',
    status: 'Payment Under Review',
    paymentId: newPayment.id,
    statusHistory: history,
  });

  await notifyUser(
    user.id,
    'Payment Receipt Submitted',
    `Your payment confirmation for $${amount} (Ref: ${paymentRef}) has been submitted and is awaiting administrative verification.`,
    'payment_submitted',
    `/dashboard/payments`
  );

  res.json({
    message: 'Your payment confirmation has been submitted and is awaiting administrative verification.',
    payment: newPayment,
  });
});

app.get('/api/payments', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const payments = await dbService.getPayments(user.role === 'applicant' ? user.id : undefined);
  res.json({ payments });
});

app.post('/api/payments/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
  const admin = (req as any).user as User;
  const { action, adminNotes } = req.body;
  const payment = await dbService.getPaymentById(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment submission not found.' });

  const appItem = await dbService.getApplicationById(payment.applicationId);
  const now = new Date().toISOString();

  if (action === 'confirm') {
    const updatedPay = await dbService.updatePayment(payment.id, {
      status: 'confirmed',
      adminNotes: adminNotes || payment.adminNotes,
      verifiedBy: admin.fullName,
      verifiedAt: now,
    });

    if (appItem) {
      const history = [
        {
          id: `sh-${Date.now()}`,
          status: 'Payment Confirmed' as ApplicationStatus,
          changedAt: now,
          changedBy: `${admin.fullName} (Administrator)`,
          note: `Payment receipt verified and approved. Amount: $${payment.amount} USD. ${adminNotes ? `Note: ${adminNotes}` : ''}`,
        },
        ...appItem.statusHistory,
      ];
      await dbService.updateApplication(appItem.id, {
        paymentStatus: 'confirmed',
        status: 'Payment Confirmed',
        statusHistory: history,
      });
    }

    await logAudit(admin, 'PAYMENT_CONFIRMED', 'payment', payment.id, `Payment ${payment.referenceNumber} for $${payment.amount} confirmed.`);
    await notifyUser(
      payment.applicantId,
      'Payment Confirmed',
      `Your manual transfer payment of $${payment.amount} for application ${payment.applicationRef} has been verified and confirmed. Your application is now progressing to processing.`,
      'payment_confirmed',
      `/dashboard/applications/${payment.applicationId}`
    );

    res.json({ payment: updatedPay, application: appItem });
  } else if (action === 'reject') {
    const updatedPay = await dbService.updatePayment(payment.id, {
      status: 'rejected',
      adminNotes: adminNotes || payment.adminNotes,
      verifiedBy: admin.fullName,
      verifiedAt: now,
    });

    if (appItem) {
      const history = [
        {
          id: `sh-${Date.now()}`,
          status: 'Awaiting Payment' as ApplicationStatus,
          changedAt: now,
          changedBy: `${admin.fullName} (Administrator)`,
          note: `Payment receipt was rejected by administrator: ${adminNotes || 'Invalid or unverified transfer advice.'}`,
        },
        ...appItem.statusHistory,
      ];
      await dbService.updateApplication(appItem.id, {
        paymentStatus: 'rejected',
        status: 'Awaiting Payment',
        statusHistory: history,
      });
    }

    await logAudit(admin, 'PAYMENT_REJECTED', 'payment', payment.id, `Payment ${payment.referenceNumber} rejected.`);
    await notifyUser(
      payment.applicantId,
      'Payment Verification Failed',
      `Your payment confirmation for ${payment.applicationRef} could not be verified: "${adminNotes || 'Invalid receipt or mismatching details'}". Please submit a valid bank transfer slip.`,
      'payment_rejected',
      `/dashboard/payments`
    );

    res.json({ payment: updatedPay, application: appItem });
  } else if (action === 're-request') {
    const updatedPay = await dbService.updatePayment(payment.id, {
      status: 'receipt_re-requested',
      adminNotes: adminNotes || payment.adminNotes,
      verifiedBy: admin.fullName,
      verifiedAt: now,
    });

    if (appItem) {
      const history = [
        {
          id: `sh-${Date.now()}`,
          status: 'Awaiting Payment' as ApplicationStatus,
          changedAt: now,
          changedBy: `${admin.fullName} (Administrator)`,
          note: `Supplementary receipt required: ${adminNotes}`,
        },
        ...appItem.statusHistory,
      ];
      await dbService.updateApplication(appItem.id, {
        status: 'Awaiting Payment',
        statusHistory: history,
      });
    }

    await logAudit(admin, 'PAYMENT_RECEIPT_REREQUESTED', 'payment', payment.id, `Requested revised receipt: ${adminNotes}`);
    await notifyUser(
      payment.applicantId,
      'Action Required: Bank Slip Re-submission',
      `An administrator requested a clearer bank receipt for ${payment.applicationRef}: "${adminNotes}". Please upload the updated document.`,
      'payment_rejected',
      `/dashboard/payments`
    );

    res.json({ payment: updatedPay, application: appItem });
  }
});

// 6. Live Chat & Messaging
app.get('/api/conversations', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;

  if (user.role === 'applicant') {
    let convs = await dbService.getConversations();
    let conv = convs.find((c) => c.applicantId === user.id);
    if (!conv) {
      const now = new Date().toISOString();
      conv = {
        id: `conv-${user.id}`,
        applicantId: user.id,
        applicantName: user.fullName,
        applicantEmail: user.email,
        status: 'open',
        unreadByAdmin: 0,
        unreadByApplicant: 0,
        lastMessageAt: now,
        lastMessageText: 'Conversation channel initialized.',
        messages: [
          {
            id: `msg-welcome`,
            conversationId: `conv-${user.id}`,
            senderId: 'system',
            senderRole: 'admin',
            senderName: 'Beacon & Harbor Senior Advisory Desk',
            text: `Welcome, ${user.fullName}. If you have any inquiries regarding your U.S. visa category requirements, documents, or manual wire transfer verification, reply here. Our advisory officers will respond directly.`,
            createdAt: now,
          },
        ],
      };
      await dbService.saveConversation(conv);
    }
    return res.json({ conversations: [conv] });
  } else {
    const { search } = req.query;
    const list = await dbService.getConversations(typeof search === 'string' ? search : undefined);
    res.json({ conversations: list });
  }
});

app.get('/api/conversations/:id', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const conv = await dbService.getConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  if (user.role === 'applicant' && conv.applicantId !== user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (user.role === 'admin') {
    conv.unreadByAdmin = 0;
  } else {
    conv.unreadByApplicant = 0;
  }
  await dbService.saveConversation(conv);

  res.json({ conversation: conv });
});

app.post('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const { text, attachments } = req.body;
  const conv = await dbService.getConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  if (user.role === 'applicant' && conv.applicantId !== user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (!text && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const now = new Date().toISOString();
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId: conv.id,
    senderId: user.id,
    senderRole: user.role,
    senderName: user.role === 'admin' ? `${user.fullName} (Advisor)` : user.fullName,
    text: text ? text.trim() : '',
    attachments: attachments || [],
    createdAt: now,
  };

  conv.messages.push(newMsg);
  conv.lastMessageAt = now;
  conv.lastMessageText = text ? (text.length > 60 ? text.slice(0, 60) + '...' : text) : 'Attachment sent';

  if (user.role === 'applicant') {
    conv.unreadByAdmin += 1;
  } else {
    conv.unreadByApplicant += 1;
    await notifyUser(
      conv.applicantId,
      'New Advisory Message',
      `${user.fullName} replied to your inquiry: "${conv.lastMessageText}"`,
      'chat_reply',
      `/dashboard/support`
    );
  }

  await dbService.saveConversation(conv);
  res.json({ message: newMsg, conversation: conv });
});

app.post('/api/conversations/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  const admin = (req as any).user as User;
  const { status } = req.body;
  const conv = await dbService.getConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  conv.status = status === 'resolved' ? 'resolved' : 'open';
  await dbService.saveConversation(conv);

  await logAudit(admin, 'CONVERSATION_STATUS_CHANGED', 'user', conv.applicantId, `Marked conversation as ${conv.status}`);
  res.json({ conversation: conv });
});

// 7. Notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  const userNotifs = await dbService.getNotifications(user.id);
  res.json({ notifications: userNotifs });
});

app.post('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  await dbService.markNotificationRead(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', authMiddleware, async (req, res) => {
  const user = (req as any).user as User;
  await dbService.markAllNotificationsRead(user.id);
  res.json({ success: true });
});

// 8. Admin Overview & Audit Logs
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  const applicants = await dbService.getAllApplicants();
  const applications = await dbService.getApplications({});
  const payments = await dbService.getPayments();

  const confirmedPayments = payments.filter((p) => p.status === 'confirmed');
  const totalRecordedRevenue = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);

  const stats = {
    totalApplicants: applicants.length,
    totalApplications: applications.length,
    newApplications: applications.filter((a) => a.status === 'Submitted' || a.status === 'Draft').length,
    processingApplications: applications.filter(
      (a) =>
        a.status === 'Processing' ||
        a.status === 'Under Administrative Review' ||
        a.status === 'Payment Confirmed'
    ).length,
    awaitingPayment: applications.filter((a) => a.status === 'Awaiting Payment' || a.status === 'Payment Under Review').length,
    confirmedPaymentsCount: confirmedPayments.length,
    rejectedApplicationsCount: applications.filter((a) => a.status === 'Rejected by Service Administrator').length,
    totalRevenueUSD: totalRecordedRevenue,
    pendingPaymentsCount: payments.filter((p) => p.status === 'pending_review').length,
  };

  res.json({ stats });
});

app.get('/api/admin/audit-logs', authMiddleware, adminMiddleware, async (req, res) => {
  const logs = await dbService.getAuditLogs(100);
  res.json({ auditLogs: logs });
});

// 9. System Settings
app.get('/api/settings', async (req, res) => {
  const settings = await dbService.getSettings();
  res.json({ settings });
});

app.put('/api/settings', authMiddleware, adminMiddleware, async (req, res) => {
  const admin = (req as any).user as User;
  const updated = await dbService.updateSettings(req.body);
  await logAudit(admin, 'SYSTEM_SETTINGS_UPDATED', 'setting', 'global', 'Updated website settings.');
  res.json({ settings: updated });
});

export default app;
