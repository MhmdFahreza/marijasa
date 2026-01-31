// app/components/lib/xendit.ts
// Xendit Payment Gateway - Invoice API Version (No Filter)

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || '';
const BASE_URL = 'https://api.xendit.co';

// ==========================================
// XENDIT PAYMENT FEES (January 2025)
// ==========================================

export const XENDIT_PAYMENT_FEES = {
  // E-Wallets - 1.5% (min Rp 1,500)
  ewallet_dana: { type: 'percentage', rate: 1.5, min: 1500, name: 'DANA', category: 'ewallet' },
  ewallet_ovo: { type: 'percentage', rate: 1.5, min: 1500, name: 'OVO', category: 'ewallet' },
  ewallet_shopeepay: { type: 'percentage', rate: 1.5, min: 1500, name: 'ShopeePay', category: 'ewallet' },
  ewallet_linkaja: { type: 'percentage', rate: 1.5, min: 1500, name: 'LinkAja', category: 'ewallet' },

  // Virtual Account - Flat fee
  va_bca: { type: 'fixed', amount: 4500, name: 'BCA Virtual Account', category: 'va' },
  va_bni: { type: 'fixed', amount: 4000, name: 'BNI Virtual Account', category: 'va' },
  va_bri: { type: 'fixed', amount: 4000, name: 'BRI Virtual Account', category: 'va' },
  va_mandiri: { type: 'fixed', amount: 4000, name: 'Mandiri Virtual Account', category: 'va' },
  va_permata: { type: 'fixed', amount: 4000, name: 'Permata Virtual Account', category: 'va' },
  va_bsi: { type: 'fixed', amount: 4000, name: 'BSI Virtual Account', category: 'va' },
  va_cimb: { type: 'fixed', amount: 4000, name: 'CIMB Niaga Virtual Account', category: 'va' },

  // QRIS - 0.7%
  qris: { type: 'percentage', rate: 0.7, min: 0, name: 'QRIS', category: 'qris' },

  // Cards - 2.9% + Rp 2,000
  card_visa: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Visa', category: 'card' },
  card_mastercard: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Mastercard', category: 'card' },
  card_jcb: { type: 'combined', rate: 2.9, fixed: 2000, name: 'JCB', category: 'card' },

  // Retail Outlets - Flat fee
  retail_alfamart: { type: 'fixed', amount: 5000, name: 'Alfamart', category: 'retail' },
  retail_indomaret: { type: 'fixed', amount: 5000, name: 'Indomaret', category: 'retail' },

  // Tunai - No fee
  tunai: { type: 'fixed', amount: 0, name: 'Tunai', category: 'tunai' },
} as const;

export type PaymentMethodId = keyof typeof XENDIT_PAYMENT_FEES;

export const SERVICE_FEE = 10000;

// ==========================================
// FEE CALCULATION
// ==========================================

export function calculateXenditFee(paymentMethod: PaymentMethodId, amount: number): number {
  const feeConfig = XENDIT_PAYMENT_FEES[paymentMethod];
  if (!feeConfig) return 0;

  switch (feeConfig.type) {
    case 'fixed':
      return feeConfig.amount;
    case 'percentage':
      return Math.max(Math.ceil(amount * (feeConfig.rate / 100)), feeConfig.min);
    case 'combined':
      return Math.ceil(amount * (feeConfig.rate / 100)) + feeConfig.fixed;
    default:
      return 0;
  }
}

export function getFeeDescription(paymentMethod: PaymentMethodId): string {
  const feeConfig = XENDIT_PAYMENT_FEES[paymentMethod];
  if (!feeConfig) return '-';

  switch (feeConfig.type) {
    case 'fixed':
      return feeConfig.amount === 0 ? 'Gratis' : `Rp ${feeConfig.amount.toLocaleString('id-ID')}`;
    case 'percentage':
      return feeConfig.min > 0
        ? `${feeConfig.rate}% (min Rp ${feeConfig.min.toLocaleString('id-ID')})`
        : `${feeConfig.rate}%`;
    case 'combined':
      return `${feeConfig.rate}% + Rp ${feeConfig.fixed.toLocaleString('id-ID')}`;
    default:
      return '-';
  }
}

// ==========================================
// CONFIGURATION CHECK
// ==========================================

export function isXenditConfigured(): boolean {
  return XENDIT_SECRET_KEY.length > 0 && XENDIT_SECRET_KEY.startsWith('xnd_');
}

export function getSecretKeyInfo(): { configured: boolean; prefix: string; length: number } {
  return {
    configured: XENDIT_SECRET_KEY.length > 0,
    prefix: XENDIT_SECRET_KEY.substring(0, 30) || 'NOT_SET',
    length: XENDIT_SECRET_KEY.length
  };
}

export function getWebhookToken(): string {
  return XENDIT_WEBHOOK_TOKEN;
}

// ==========================================
// XENDIT API REQUEST
// ==========================================

async function xenditRequest(endpoint: string, method: string = 'GET', body?: any) {
  console.log(`\n[Xendit API] ${method} ${endpoint}`);

  if (!isXenditConfigured()) {
    throw new Error('Xendit API key not configured');
  }

  const url = `${BASE_URL}${endpoint}`;
  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  if (body) {
    console.log('[Xendit API] Request body:', JSON.stringify(body, null, 2));
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log('[Xendit API] Response status:', response.status, response.statusText);

  const responseText = await response.text();
  console.log('[Xendit API] Response:', responseText.substring(0, 500));

  let data: any;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`Invalid response: ${responseText.substring(0, 200)}`);
  }

  if (!response.ok) {
    const errorMsg = data.message || data.error_code || `Error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// ==========================================
// CREATE QR CODE PAYMENT (QRIS)
// ==========================================

export interface CreateQRISPaymentParams {
  externalId: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
  qrType?: 'DYNAMIC' | 'STATIC';
  expirationDate?: Date;
}

export async function createQRISPayment(params: CreateQRISPaymentParams) {
  const body: any = {
    external_id: params.externalId,
    type: 'DYNAMIC',
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/xendit/webhook`,
    amount: params.amount,
    currency: 'IDR',
    description: params.description || 'Pembayaran SELSAS',
    expires_at: params.expirationDate ? params.expirationDate.toISOString() :
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 jam
  };

  // Add customer info if provided
  if (params.customerName || params.customerPhone || params.customerEmail) {
    body.customer = {};
    if (params.customerName) body.customer.given_names = params.customerName;
    if (params.customerPhone) body.customer.mobile_number = params.customerPhone;
    if (params.customerEmail) body.customer.email = params.customerEmail;
  }

  return xenditRequest('/qr_codes', 'POST', body);
}

// ==========================================
// CREATE INVOICE (Universal - NO FILTER)
// ==========================================

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  customerName?: string;
  customerPhone?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  paymentMethods?: string[]; // OPTIONAL - jika tidak ada, Xendit tampilkan semua
  invoiceDuration?: number;
}

export async function createXenditInvoice(params: CreateInvoiceParams) {
  // Build request body - HANYA field yang diperlukan
  const body: any = {
    external_id: params.externalId,
    amount: params.amount,
    payer_email: params.payerEmail,
    description: params.description,
    currency: 'IDR',
    invoice_duration: params.invoiceDuration || 86400,
  };

  // Add customer info if provided
  if (params.customerName || params.customerPhone) {
    body.customer = {};
    if (params.customerName) body.customer.given_names = params.customerName;
    if (params.customerPhone) body.customer.mobile_number = params.customerPhone;
  }

  // Add redirect URLs if provided
  if (params.successRedirectUrl) body.success_redirect_url = params.successRedirectUrl;
  if (params.failureRedirectUrl) body.failure_redirect_url = params.failureRedirectUrl;

  // IMPORTANT: JANGAN kirim payment_methods jika tidak ada atau kosong
  // Ini akan membuat Xendit menampilkan SEMUA metode yang aktif di dashboard
  if (params.paymentMethods && params.paymentMethods.length > 0) {
    body.payment_methods = params.paymentMethods;
  }
  // Jika paymentMethods undefined atau [], TIDAK ditambahkan ke body

  return xenditRequest('/v2/invoices', 'POST', body);
}

// ==========================================
// GET QR CODE DETAILS
// ==========================================

export async function getQRCodeDetails(qrCodeId: string) {
  return xenditRequest(`/qr_codes/${qrCodeId}`, 'GET');
}

// ==========================================
// PAYMENT METHOD CATEGORIES FOR UI
// ==========================================

export const PAYMENT_METHOD_CATEGORIES = {
  ewallet: {
    name: 'E-Wallet',
    icon: 'Wallet',
    methods: ['ewallet_dana', 'ewallet_ovo', 'ewallet_shopeepay', 'ewallet_linkaja'],
  },
  va: {
    name: 'Virtual Account',
    icon: 'Building',
    methods: ['va_bca', 'va_bni', 'va_bri', 'va_mandiri', 'va_permata', 'va_bsi', 'va_cimb'],
  },
  qris: {
    name: 'QRIS',
    icon: 'QrCode',
    methods: ['qris'],
  },
  card: {
    name: 'Kartu Kredit/Debit',
    icon: 'CreditCard',
    methods: ['card_visa', 'card_mastercard', 'card_jcb'],
  },
  retail: {
    name: 'Gerai Retail',
    icon: 'Store',
    methods: ['retail_alfamaret', 'retail_indomaret'],
  },
  tunai: {
    name: 'Tunai',
    icon: 'Banknote',
    methods: ['tunai'],
  },
} as const;

export function getAllPaymentMethods() {
  return Object.entries(XENDIT_PAYMENT_FEES).map(([id, config]) => ({ id, ...config }));
}

export function getPaymentMethodsByCategory() {
  const result: Record<string, Array<{ id: string; name: string; feeDescription: string }>> = {};

  Object.entries(PAYMENT_METHOD_CATEGORIES).forEach(([categoryKey, category]) => {
    result[categoryKey] = category.methods.map(methodId => ({
      id: methodId,
      name: XENDIT_PAYMENT_FEES[methodId as PaymentMethodId].name,
      feeDescription: getFeeDescription(methodId as PaymentMethodId),
    }));
  });

  return result;
}