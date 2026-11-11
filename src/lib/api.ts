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
} from '../types';

const TOKEN_KEY = 'beacon_harbor_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Setup & Auth
  async checkAdminSetupStatus(): Promise<{ needsSetup: boolean }> {
    return request<{ needsSetup: boolean }>('/api/admin/setup-status');
  },

  async setupInitialAdmin(data: any): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/admin/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(data: any): Promise<{ user: User; token: string; demoVerificationCode?: string }> {
    const res = await request<{ user: User; token: string; demoVerificationCode?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async verifyEmail(code: string): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string; demoResetToken?: string }> {
    return request<{ message: string; demoResetToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data: { email: string; resetToken: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfile(data: { fullName?: string; phone?: string; countryOfResidence?: string }): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Upload helper
  async uploadFile(file: File, documentType?: string): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await request<{ url: string; fileName: string; fileSize: number; mimeType: string }>('/api/uploads', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || 'application/octet-stream',
              base64Data,
              documentType,
            }),
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file for upload'));
      reader.readAsDataURL(file);
    });
  },

  // Applications
  async getApplications(params?: { status?: string; category?: string; search?: string }): Promise<{ applications: VisaApplication[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ applications: VisaApplication[] }>(`/api/applications${qs}`);
  },

  async getApplication(id: string): Promise<{ application: VisaApplication }> {
    return request<{ application: VisaApplication }>(`/api/applications/${id}`);
  },

  async createApplication(data: Partial<VisaApplication> & { isDraft?: boolean }): Promise<{ application: VisaApplication }> {
    return request<{ application: VisaApplication }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApplication(id: string, data: Partial<VisaApplication>): Promise<{ application: VisaApplication }> {
    return request<{ application: VisaApplication }>(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async submitApplication(id: string): Promise<{ application: VisaApplication }> {
    return request<{ application: VisaApplication }>(`/api/applications/${id}/submit`, {
      method: 'POST',
    });
  },

  // Admin Application Actions
  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    note?: string,
    rejectionReason?: string
  ): Promise<{ application: VisaApplication }> {
    return request<{ application: VisaApplication }>(`/api/applications/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note, rejectionReason }),
    });
  },

  async addAdminNote(id: string, note: string): Promise<{ adminNotes: string[] }> {
    return request<{ adminNotes: string[] }>(`/api/applications/${id}/admin-notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async requestSupplementaryDocuments(id: string, instructions: string): Promise<{ application: VisaApplication }> {
    return request<{ application: VisaApplication }>(`/api/applications/${id}/request-documents`, {
      method: 'POST',
      body: JSON.stringify({ instructions }),
    });
  },

  // Payment Methods
  async getPaymentMethods(): Promise<{ paymentMethods: PaymentMethod[] }> {
    return request<{ paymentMethods: PaymentMethod[] }>('/api/payment-methods');
  },

  async savePaymentMethod(method: Partial<PaymentMethod>): Promise<{ paymentMethods: PaymentMethod[] }> {
    return request<{ paymentMethods: PaymentMethod[] }>('/api/payment-methods', {
      method: 'POST',
      body: JSON.stringify(method),
    });
  },

  async deletePaymentMethod(id: string): Promise<{ paymentMethods: PaymentMethod[] }> {
    return request<{ paymentMethods: PaymentMethod[] }>(`/api/payment-methods/${id}`, {
      method: 'DELETE',
    });
  },

  // Payments
  async submitPayment(data: {
    applicationId: string;
    amount: number;
    paymentMethodId: string;
    transactionReference: string;
    paymentDate: string;
    receiptFileUrl: string;
    receiptFileName: string;
  }): Promise<{ message: string; payment: PaymentSubmission }> {
    return request<{ message: string; payment: PaymentSubmission }>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPayments(): Promise<{ payments: PaymentSubmission[] }> {
    return request<{ payments: PaymentSubmission[] }>('/api/payments');
  },

  async verifyPayment(
    paymentId: string,
    action: 'confirm' | 'reject' | 're-request',
    adminNotes?: string
  ): Promise<{ payment: PaymentSubmission; application: VisaApplication }> {
    return request<{ payment: PaymentSubmission; application: VisaApplication }>(`/api/payments/${paymentId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNotes }),
    });
  },

  // Chat & Support
  async getConversations(search?: string): Promise<{ conversations: Conversation[] }> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ conversations: Conversation[] }>(`/api/conversations${qs}`);
  },

  async getConversation(id: string): Promise<{ conversation: Conversation }> {
    return request<{ conversation: Conversation }>(`/api/conversations/${id}`);
  },

  async sendMessage(
    conversationId: string,
    text: string,
    attachments?: Array<{ id: string; name: string; url: string; size: number; mimeType: string }>
  ): Promise<{ message: ChatMessage; conversation: Conversation }> {
    return request<{ message: ChatMessage; conversation: Conversation }>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, attachments }),
    });
  },

  async updateConversationStatus(conversationId: string, status: 'open' | 'resolved'): Promise<{ conversation: Conversation }> {
    return request<{ conversation: Conversation }>(`/api/conversations/${conversationId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    return request<{ notifications: Notification[] }>('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  // Admin stats & logs
  async getAdminStats(): Promise<{ stats: any }> {
    return request<{ stats: any }>('/api/admin/stats');
  },

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return request<{ auditLogs: AuditLog[] }>('/api/admin/audit-logs');
  },

  // Settings
  async getSettings(): Promise<{ settings: SystemSettings }> {
    return request<{ settings: SystemSettings }>('/api/settings');
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<{ settings: SystemSettings }> {
    return request<{ settings: SystemSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
