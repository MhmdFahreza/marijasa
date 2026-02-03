// app/components/lib/xendit.ts
// Xendit Payment Gateway - Full Integration (All Payment Methods)
// Updated: January 2025
// ✅ FIXED: Removed 'description' field from Virtual Account (not supported by BCA and some other banks)
// ✅ FIXED: Added URL sanitization to prevent malformed redirect URLs

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || '';
const XENDIT_PUBLIC_KEY = process.env.XENDIT_PUBLIC_KEY || '';
const BASE_URL = 'https://api.xendit.co';

// ==========================================
// URL SANITIZATION HELPER
// ==========================================

function sanitizeAppUrl(url: string | undefined): string {
  const defaultUrl = 'http://localhost:3000';
  
  if (!url) return defaultUrl;
  
  // Remove any surrounding quotes
  let sanitized = url.replace(/^["']|["']$/g, '');
  
  // Remove any inline comments (everything after space followed by //)
  sanitized = sanitized.split(/\s+\/\//)[0].trim();
  
  // Remove any trailing slashes
  sanitized = sanitized.replace(/\/+$/, '');
  
  // Validate URL format
  try {
    new URL(sanitized);
    return sanitized;
  } catch {
    console.warn(`[Xendit] Invalid APP_URL: "${url}", using default: ${defaultUrl}`);
    return defaultUrl;
  }
}

const APP_URL = sanitizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);

console.log(`[Xendit] Using APP_URL: ${APP_URL}`);

// ==========================================
// XENDIT PAYMENT FEES (January 2025)
// Source: xendit.co/id/pricing
// ==========================================

export const XENDIT_PAYMENT_FEES = {
  // E-Wallets - 1.5% (min Rp 1,500)
  ewallet_dana: { type: 'percentage', rate: 1.5, min: 1500, name: 'DANA', category: 'ewallet', channelCode: 'ID_DANA' },
  ewallet_ovo: { type: 'percentage', rate: 1.5, min: 1500, name: 'OVO', category: 'ewallet', channelCode: 'ID_OVO' },
  ewallet_shopeepay: { type: 'percentage', rate: 1.5, min: 1500, name: 'ShopeePay', category: 'ewallet', channelCode: 'ID_SHOPEEPAY' },
  ewallet_linkaja: { type: 'percentage', rate: 1.5, min: 1500, name: 'LinkAja', category: 'ewallet', channelCode: 'ID_LINKAJA' },

  // Virtual Account - Flat fee
  va_bca: { type: 'fixed', amount: 4500, name: 'BCA Virtual Account', category: 'va', bankCode: 'BCA' },
  va_bni: { type: 'fixed', amount: 4000, name: 'BNI Virtual Account', category: 'va', bankCode: 'BNI' },
  va_bri: { type: 'fixed', amount: 4000, name: 'BRI Virtual Account', category: 'va', bankCode: 'BRI' },
  va_mandiri: { type: 'fixed', amount: 4000, name: 'Mandiri Virtual Account', category: 'va', bankCode: 'MANDIRI' },
  va_permata: { type: 'fixed', amount: 4000, name: 'Permata Virtual Account', category: 'va', bankCode: 'PERMATA' },
  va_bsi: { type: 'fixed', amount: 4000, name: 'BSI Virtual Account', category: 'va', bankCode: 'BSI' },
  va_cimb: { type: 'fixed', amount: 4000, name: 'CIMB Niaga Virtual Account', category: 'va', bankCode: 'CIMB' },

  // QRIS - 0.7%
  qris: { type: 'percentage', rate: 0.7, min: 0, name: 'QRIS', category: 'qris', channelCode: 'QRIS' },

  // Cards - 2.9% + Rp 2,000
  card_visa: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Visa', category: 'card', cardNetwork: 'VISA' },
  card_mastercard: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Mastercard', category: 'card', cardNetwork: 'MASTERCARD' },
  card_jcb: { type: 'combined', rate: 2.9, fixed: 2000, name: 'JCB', category: 'card', cardNetwork: 'JCB' },

  // Retail Outlets - Flat fee
  retail_alfamart: { type: 'fixed', amount: 5000, name: 'Alfamart', category: 'retail', retailCode: 'ALFAMART' },
  retail_indomaret: { type: 'fixed', amount: 5000, name: 'Indomaret', category: 'retail', retailCode: 'INDOMARET' },

  // Tunai - No fee (tidak perlu Xendit)
  tunai: { type: 'fixed', amount: 0, name: 'Tunai', category: 'tunai', channelCode: 'CASH' },
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
// GET APP URL (for external use)
// ==========================================

export function getAppUrl(): string {
  return APP_URL;
}

// ==========================================
// XENDIT API REQUEST (Core Function)
// ==========================================

async function xenditRequest(endpoint: string, method: string = 'GET', body?: any, apiVersion?: string) {
  console.log(`\n[Xendit API] ${method} ${endpoint}`);

  if (!isXenditConfigured()) {
    throw new Error('Xendit API key not configured. Please set XENDIT_SECRET_KEY in environment variables.');
  }

  const url = `${BASE_URL}${endpoint}`;
  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  const headers: Record<string, string> = {
    'Authorization': `Basic ${authString}`,
    'Content-Type': 'application/json',
  };

  // Add API version header if specified
  if (apiVersion) {
    headers['api-version'] = apiVersion;
  }

  if (body) {
    console.log('[Xendit API] Request body:', JSON.stringify(body, null, 2));
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log('[Xendit API] Response status:', response.status, response.statusText);

  const responseText = await response.text();
  console.log('[Xendit API] Response:', responseText.substring(0, 1000));

  let data: any;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`Invalid response from Xendit: ${responseText.substring(0, 200)}`);
  }

  if (!response.ok) {
    const errorMsg = data.message || data.error_code || `Error ${response.status}`;
    console.error('[Xendit API] Error:', errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}

// ==========================================
// 1. QRIS PAYMENT (QR Code API)
// ==========================================

export interface CreateQRISPaymentParams {
  externalId: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
  expirationDate?: Date;
}

export interface QRISPaymentResponse {
  id: string;
  external_id: string;
  amount: number;
  qr_string: string;
  qr_code_url?: string;
  invoice_url?: string;
  status: string;
  type: string;
  currency: string;
  expires_at: string;
  created: string;
  updated: string;
}

export async function createQRISPayment(params: CreateQRISPaymentParams): Promise<QRISPaymentResponse> {
  console.log('\n[QRIS] Creating QR Code payment...');

  const body: any = {
    external_id: params.externalId,
    type: 'DYNAMIC',
    callback_url: `${APP_URL}/api/payments/xendit/webhook`,
    amount: params.amount,
    currency: 'IDR',
    description: params.description || 'Pembayaran SELSAS',
    expires_at: params.expirationDate?.toISOString() ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  if (params.customerName || params.customerPhone || params.customerEmail) {
    body.metadata = {
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail,
    };
  }

  return xenditRequest('/qr_codes', 'POST', body);
}

export async function getQRCodeDetails(qrCodeId: string): Promise<QRISPaymentResponse> {
  return xenditRequest(`/qr_codes/${qrCodeId}`, 'GET');
}

// ==========================================
// 2. E-WALLET PAYMENT (E-Wallet Charges API)
// ==========================================

export interface CreateEWalletPaymentParams {
  externalId: string;
  amount: number;
  channelCode: string; // ID_OVO, ID_DANA, ID_SHOPEEPAY, ID_LINKAJA
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
}

export interface EWalletPaymentResponse {
  id: string;
  business_id: string;
  reference_id: string;
  status: string;
  currency: string;
  charge_amount: number;
  capture_amount: number;
  channel_code: string;
  channel_properties: {
    success_redirect_url?: string;
    failure_redirect_url?: string;
    mobile_number?: string;
  };
  actions?: {
    desktop_web_checkout_url?: string;
    mobile_web_checkout_url?: string;
    mobile_deeplink_checkout_url?: string;
    qr_checkout_string?: string;
  };
  is_redirect_required: boolean;
  callback_url: string;
  created: string;
  updated: string;
  voided_at?: string;
  capture_now: boolean;
  customer_id?: string;
  payment_method_id?: string;
  failure_code?: string;
  metadata?: Record<string, any>;
}

export async function createEWalletPayment(params: CreateEWalletPaymentParams): Promise<EWalletPaymentResponse> {
  console.log('\n[E-Wallet] Creating E-Wallet charge...');
  console.log('[E-Wallet] Channel:', params.channelCode);

  // Sanitize redirect URLs
  const successUrl = sanitizeRedirectUrl(params.successRedirectUrl) || `${APP_URL}/riwayat_pemesanan?status=success`;
  const failureUrl = sanitizeRedirectUrl(params.failureRedirectUrl) || `${APP_URL}/riwayat_pemesanan?status=failed`;

  console.log('[E-Wallet] Success URL:', successUrl);
  console.log('[E-Wallet] Failure URL:', failureUrl);

  const body: any = {
    reference_id: params.externalId,
    currency: 'IDR',
    amount: params.amount,
    checkout_method: 'ONE_TIME_PAYMENT',
    channel_code: params.channelCode,
    channel_properties: {
      success_redirect_url: successUrl,
      failure_redirect_url: failureUrl,
    },
    metadata: {
      description: params.description || 'Pembayaran SELSAS',
      customer_name: params.customerName,
      customer_email: params.customerEmail,
    },
  };

  // OVO requires phone number
  if (params.channelCode === 'ID_OVO' && params.customerPhone) {
    body.channel_properties.mobile_number = params.customerPhone.startsWith('+62')
      ? params.customerPhone
      : `+62${params.customerPhone.replace(/^0/, '')}`;
  }

  return xenditRequest('/ewallets/charges', 'POST', body, '2021-01-25');
}

// Helper function to sanitize redirect URLs
function sanitizeRedirectUrl(url: string | undefined): string | null {
  if (!url) return null;

  // Remove any surrounding quotes
  let sanitized = url.replace(/^["']|["']$/g, '');

  // Remove any inline comments (everything after space followed by //)
  sanitized = sanitized.split(/\s+\/\//)[0].trim();

  // Validate URL format
  try {
    new URL(sanitized);
    return sanitized;
  } catch {
    console.warn(`[Xendit] Invalid redirect URL: "${url}"`);
    return null;
  }
}

export async function getEWalletChargeStatus(chargeId: string): Promise<EWalletPaymentResponse> {
  return xenditRequest(`/ewallets/charges/${chargeId}`, 'GET', undefined, '2021-01-25');
}

// ==========================================
// 3. VIRTUAL ACCOUNT PAYMENT (VA API)
// ✅ FIXED: Removed 'description' field - not supported by BCA and some banks
// ==========================================

export interface CreateVirtualAccountParams {
  externalId: string;
  bankCode: string; // BCA, BNI, BRI, MANDIRI, PERMATA, BSI, CIMB
  amount: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string; // ⚠️ NOTE: This is kept in params but NOT sent to Xendit API
  expirationDate?: Date;
  isSingleUse?: boolean;
  isClosed?: boolean; // true = exact amount required
}

export interface VirtualAccountResponse {
  id: string;
  owner_id: string;
  external_id: string;
  merchant_code: string;
  account_number: string;
  bank_code: string;
  name: string;
  is_closed: boolean;
  expected_amount: number;
  suggested_amount?: number;
  expiration_date: string;
  is_single_use: boolean;
  status: string;
  currency: string;
  country: string;
}

export async function createVirtualAccount(params: CreateVirtualAccountParams): Promise<VirtualAccountResponse> {
  console.log('\n[VA] Creating Virtual Account...');
  console.log('[VA] Bank:', params.bankCode);

  const body: any = {
    external_id: params.externalId,
    bank_code: params.bankCode,
    name: params.customerName || 'SELSAS Customer',
    expected_amount: params.amount,
    is_closed: params.isClosed !== false, // Default: true (exact amount)
    is_single_use: params.isSingleUse !== false, // Default: true
    expiration_date: params.expirationDate?.toISOString() ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    // ⚠️ REMOVED: description field
    // Reason: Not supported by BCA and some other banks
    // Error: "description is not supported for the bank chosen: BCA"
    // description: params.description || 'Pembayaran SELSAS',
  };

  return xenditRequest('/callback_virtual_accounts', 'POST', body);
}

export async function getVirtualAccountDetails(vaId: string): Promise<VirtualAccountResponse> {
  return xenditRequest(`/callback_virtual_accounts/${vaId}`, 'GET');
}

export async function getVirtualAccountPayment(paymentId: string): Promise<any> {
  return xenditRequest(`/callback_virtual_account_payments/payment_id=${paymentId}`, 'GET');
}

// ==========================================
// 4. RETAIL OUTLET PAYMENT (Fixed Payment Code API)
// ==========================================

export interface CreateRetailPaymentParams {
  externalId: string;
  retailOutletName: string; // ALFAMART, INDOMARET
  amount: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
  expirationDate?: Date;
  isSingleUse?: boolean;
}

export interface RetailPaymentResponse {
  id: string;
  owner_id: string;
  external_id: string;
  retail_outlet_name: string;
  prefix: string;
  name: string;
  payment_code: string;
  expected_amount: number;
  is_single_use: boolean;
  expiration_date: string;
  status: string;
}

export async function createRetailPayment(params: CreateRetailPaymentParams): Promise<RetailPaymentResponse> {
  console.log('\n[Retail] Creating Retail Outlet payment...');
  console.log('[Retail] Outlet:', params.retailOutletName);

  const body: any = {
    external_id: params.externalId,
    retail_outlet_name: params.retailOutletName,
    name: params.customerName || 'SELSAS Customer',
    expected_amount: params.amount,
    is_single_use: params.isSingleUse !== false,
    expiration_date: params.expirationDate?.toISOString() ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  return xenditRequest('/fixed_payment_code', 'POST', body);
}

export async function getRetailPaymentDetails(paymentCodeId: string): Promise<RetailPaymentResponse> {
  return xenditRequest(`/fixed_payment_code/${paymentCodeId}`, 'GET');
}

// ==========================================
// 5. CARD PAYMENT (Invoice API with Card)
// ==========================================

export interface CreateCardPaymentParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  invoiceDuration?: number;
}

export interface CardPaymentResponse {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  merchant_name: string;
  merchant_profile_picture_url: string;
  amount: number;
  payer_email: string;
  description: string;
  expiry_date: string;
  invoice_url: string;
  available_banks: any[];
  available_retail_outlets: any[];
  available_ewallets: any[];
  should_exclude_credit_card: boolean;
  should_send_email: boolean;
  created: string;
  updated: string;
  currency: string;
}

export async function createCardPayment(params: CreateCardPaymentParams): Promise<CardPaymentResponse> {
  console.log('\n[Card] Creating Card payment via Invoice...');

  // Sanitize redirect URLs
  const successUrl = sanitizeRedirectUrl(params.successRedirectUrl) || `${APP_URL}/riwayat_pemesanan?status=success`;
  const failureUrl = sanitizeRedirectUrl(params.failureRedirectUrl) || `${APP_URL}/riwayat_pemesanan?status=failed`;

  const body: any = {
    external_id: params.externalId,
    amount: params.amount,
    payer_email: params.payerEmail,
    description: params.description || 'Pembayaran SELSAS',
    currency: 'IDR',
    invoice_duration: params.invoiceDuration || 86400,
    // Only allow card payments
    payment_methods: ['CREDIT_CARD'],
    success_redirect_url: successUrl,
    failure_redirect_url: failureUrl,
  };

  if (params.customerName || params.customerPhone) {
    body.customer = {
      given_names: params.customerName,
      mobile_number: params.customerPhone,
      email: params.payerEmail,
    };
  }

  return xenditRequest('/v2/invoices', 'POST', body);
}

// ==========================================
// 6. UNIVERSAL INVOICE (Supports All Methods)
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
  paymentMethods?: string[];
  invoiceDuration?: number;
}

export async function createXenditInvoice(params: CreateInvoiceParams): Promise<CardPaymentResponse> {
  console.log('\n[Invoice] Creating Universal Invoice...');

  // Sanitize redirect URLs
  const successUrl = sanitizeRedirectUrl(params.successRedirectUrl);
  const failureUrl = sanitizeRedirectUrl(params.failureRedirectUrl);

  const body: any = {
    external_id: params.externalId,
    amount: params.amount,
    payer_email: params.payerEmail,
    description: params.description,
    currency: 'IDR',
    invoice_duration: params.invoiceDuration || 86400,
  };

  if (params.customerName || params.customerPhone) {
    body.customer = {
      given_names: params.customerName,
      mobile_number: params.customerPhone,
      email: params.payerEmail,
    };
  }

  if (successUrl) body.success_redirect_url = successUrl;
  if (failureUrl) body.failure_redirect_url = failureUrl;

  // Only add payment_methods if specified (otherwise Xendit shows all)
  if (params.paymentMethods && params.paymentMethods.length > 0) {
    body.payment_methods = params.paymentMethods;
  }

  return xenditRequest('/v2/invoices', 'POST', body);
}

export async function getInvoiceDetails(invoiceId: string): Promise<CardPaymentResponse> {
  return xenditRequest(`/v2/invoices/${invoiceId}`, 'GET');
}

export async function expireInvoice(invoiceId: string): Promise<CardPaymentResponse> {
  return xenditRequest(`/invoices/${invoiceId}/expire!`, 'POST');
}

// ==========================================
// PAYMENT STATUS CHECK (Universal)
// ==========================================

export interface PaymentStatusResult {
  found: boolean;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'UNKNOWN';
  paymentType: string;
  xenditId?: string;
  paidAt?: string;
  paidAmount?: number;
  paymentChannel?: string;
  rawData?: any;
}

export async function checkPaymentStatus(externalId: string, paymentType: string): Promise<PaymentStatusResult> {
  console.log(`\n[Status Check] Checking ${paymentType} payment for ${externalId}`);

  try {
    switch (paymentType) {
      case 'qris': {
        // For QRIS, we need to find by external_id
        // Xendit doesn't have direct lookup by external_id for QR codes
        // Payment status comes via webhook
        return {
          found: false,
          status: 'UNKNOWN',
          paymentType: 'qris',
        };
      }

      case 'ewallet': {
        // E-Wallet charges can be queried by reference_id
        const charges = await xenditRequest(`/ewallets/charges?reference_id=${externalId}`, 'GET', undefined, '2021-01-25');
        if (charges && charges.length > 0) {
          const charge = charges[0];
          return {
            found: true,
            status: mapXenditStatus(charge.status),
            paymentType: 'ewallet',
            xenditId: charge.id,
            paidAt: charge.updated,
            paidAmount: charge.capture_amount,
            paymentChannel: charge.channel_code,
            rawData: charge,
          };
        }
        break;
      }

      case 'va': {
        // VA payments come via webhook
        // No direct status check available
        return {
          found: false,
          status: 'UNKNOWN',
          paymentType: 'va',
        };
      }

      case 'retail': {
        // Retail payments come via webhook
        return {
          found: false,
          status: 'UNKNOWN',
          paymentType: 'retail',
        };
      }

      case 'card': {
        // Card payments use Invoice API
        const invoices = await xenditRequest(`/v2/invoices?external_id=${externalId}`, 'GET');
        if (invoices && invoices.length > 0) {
          const invoice = invoices[0];
          return {
            found: true,
            status: mapXenditStatus(invoice.status),
            paymentType: 'card',
            xenditId: invoice.id,
            paidAt: invoice.paid_at,
            paidAmount: invoice.paid_amount,
            paymentChannel: invoice.payment_channel,
            rawData: invoice,
          };
        }
        break;
      }
    }

    return {
      found: false,
      status: 'UNKNOWN',
      paymentType,
    };

  } catch (error) {
    console.error('[Status Check] Error:', error);
    return {
      found: false,
      status: 'UNKNOWN',
      paymentType,
    };
  }
}

function mapXenditStatus(status: string): 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'UNKNOWN' {
  const statusUpper = (status || '').toUpperCase();

  if (['PAID', 'SETTLED', 'SUCCEEDED', 'CAPTURED', 'COMPLETED'].includes(statusUpper)) {
    return 'PAID';
  }
  if (['PENDING', 'ACTIVE', 'AWAITING_CAPTURE'].includes(statusUpper)) {
    return 'PENDING';
  }
  if (['FAILED', 'VOIDED', 'REFUNDED'].includes(statusUpper)) {
    return 'FAILED';
  }
  if (['EXPIRED', 'INACTIVE'].includes(statusUpper)) {
    return 'EXPIRED';
  }

  return 'UNKNOWN';
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
    methods: ['retail_alfamart', 'retail_indomaret'],
  },
  tunai: {
    name: 'Tunai',
    icon: 'Banknote',
    methods: ['tunai'],
  },
} as const;

export function getAllPaymentMethods() {
  return Object.entries(XENDIT_PAYMENT_FEES).map(([id, config]) => ({
    id,
    ...config,
  }));
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

// ==========================================
// HELPER: Get Xendit Channel Code
// ==========================================

export function getXenditChannelCode(paymentMethod: PaymentMethodId): string | null {
  const config = XENDIT_PAYMENT_FEES[paymentMethod];
  if (!config) return null;

  if ('channelCode' in config) return config.channelCode;
  if ('bankCode' in config) return config.bankCode;
  if ('retailCode' in config) return config.retailCode;
  if ('cardNetwork' in config) return config.cardNetwork;

  return null;
}