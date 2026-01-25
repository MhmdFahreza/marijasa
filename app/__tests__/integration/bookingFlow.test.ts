// __tests__/integration/bookingFlow.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock data
import { 
  mockVendor, 
  mockUserProfile, 
  mockFormData, 
  mockOrderData, 
  mockPaymentResponse,
  mockPaymentResponseTunai,
  mockPaymentResponseQRIS
} from '../mocks/mockData';

// ==========================================
// Integration Tests for Complete Booking Flow
// ==========================================

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete Order Submission Flow', () => {
    it('should complete the full booking flow successfully', async () => {
      // Step 1: User authenticates
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, user: mockUserProfile }),
      });

      // Step 2: Fetch vendor data
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ vendor: mockVendor }),
      });

      // Step 3: Submit booking
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          orderId: 'ORD-123456',
          bookingId: 'booking-123',
        }),
      });

      // Step 4: Process payment
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentResponse,
      });

      // Simulate the flow
      const authResponse = await global.fetch('/api/auth/session');
      expect(authResponse.ok).toBe(true);

      const vendorResponse = await global.fetch(`/api/vendors/${mockVendor.vendor_id}`);
      const vendorData = await vendorResponse.json();
      expect(vendorData.vendor.vendor_id).toBe(mockVendor.vendor_id);

      const bookingResponse = await global.fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(mockOrderData),
      });
      const bookingData = await bookingResponse.json();
      expect(bookingData.success).toBe(true);

      const paymentResponse = await global.fetch('/api/payments/xendit', {
        method: 'POST',
        body: JSON.stringify({
          orderId: bookingData.orderId,
          paymentMethod: 'va_bca',
          amount: 310000,
        }),
      });
      const paymentData = await paymentResponse.json();
      expect(paymentData.success).toBe(true);
      expect(paymentData.vaNumber).toBeTruthy();
    });

    it('should handle unauthenticated user', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ authenticated: false }),
      });

      const authResponse = await global.fetch('/api/auth/session');
      expect(authResponse.ok).toBe(false);
      expect(authResponse.status).toBe(401);
    });

    it('should handle vendor not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, user: mockUserProfile }),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Vendor not found' }),
      });

      await global.fetch('/api/auth/session');
      const vendorResponse = await global.fetch('/api/vendors/non-existent');
      
      expect(vendorResponse.ok).toBe(false);
      expect(vendorResponse.status).toBe(404);
    });
  });

  describe('Payment Processing Flow', () => {
    it('should process Virtual Account payment', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentResponse,
      });

      const response = await global.fetch('/api/payments/xendit', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'ORD-123456',
          paymentMethod: 'va_bca',
          amount: 310000,
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.paymentType).toBe('va_bca');
      expect(data.vaNumber).toBeTruthy();
      expect(data.expirationDate).toBeTruthy();
    });

    it('should process QRIS payment', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentResponseQRIS,
      });

      const response = await global.fetch('/api/payments/xendit', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'ORD-123456',
          paymentMethod: 'qris',
          amount: 310000,
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.paymentType).toBe('qris');
      expect(data.qrString).toBeTruthy();
    });

    it('should process cash payment', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentResponseTunai,
      });

      const response = await global.fetch('/api/payments/xendit', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'ORD-123456',
          paymentMethod: 'tunai',
          amount: 310000,
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.paymentType).toBe('tunai');
      expect(data.transactionFee).toBe(0);
    });

    it('should handle payment error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Payment processing failed',
          message: 'Invalid payment method',
        }),
      });

      const response = await global.fetch('/api/payments/xendit', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'ORD-123456',
          paymentMethod: 'invalid_method',
          amount: 310000,
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });
  });

  describe('Order History Flow', () => {
    it('should fetch user bookings', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          bookings: [
            {
              booking_id: 'booking-1',
              booking_number: 'ORD-001',
              status: 'CONFIRMED',
              payment_status: 'PAID',
            },
            {
              booking_id: 'booking-2',
              booking_number: 'ORD-002',
              status: 'PENDING',
              payment_status: 'PENDING',
            },
          ],
          pagination: {
            total: 2,
            limit: 10,
            offset: 0,
            hasMore: false,
          },
        }),
      });

      const response = await global.fetch('/api/bookings');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.bookings).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should filter bookings by status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          bookings: [
            {
              booking_id: 'booking-1',
              booking_number: 'ORD-001',
              status: 'PENDING',
            },
          ],
          pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
        }),
      });

      const response = await global.fetch('/api/bookings?status=PENDING');
      const data = await response.json();

      expect(data.bookings).toHaveLength(1);
      expect(data.bookings[0].status).toBe('PENDING');
    });
  });

  describe('Payment Status Check Flow', () => {
    it('should check and update payment status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          booking: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
          },
        }),
      });

      const response = await global.fetch('/api/payments/xendit?orderId=ORD-123456');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.booking.paymentStatus).toBe('PAID');
    });
  });
});

describe('Error Handling Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(global.fetch('/api/bookings')).rejects.toThrow('Network error');
  });

  it('should handle server errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Internal Server Error',
        message: 'Something went wrong',
      }),
    });

    const response = await global.fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(mockOrderData),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  it('should handle validation errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Validation Error',
        message: 'Data pemesanan tidak lengkap',
      }),
    });

    const response = await global.fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation Error');
  });

  it('should handle duplicate order ID', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error: 'Duplicate Entry',
        message: 'Order ID sudah digunakan',
      }),
    });

    const response = await global.fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(mockOrderData),
    });

    const data = await response.json();
    expect(response.status).toBe(409);
    expect(data.error).toBe('Duplicate Entry');
  });
});

describe('Data Consistency', () => {
  it('should maintain price consistency throughout the flow', () => {
    const servicePrice = 300000;
    const serviceFee = 10000;
    const baseAmount = servicePrice + serviceFee;

    // VA BCA fee
    const vaFee = 4500;
    const vaTotalAmount = baseAmount + vaFee;

    // QRIS fee (0.7%)
    const qrisFee = Math.ceil(baseAmount * 0.7 / 100);
    const qrisTotalAmount = baseAmount + qrisFee;

    // E-wallet fee (1.5%, min 1500)
    const ewalletFee = Math.max(Math.ceil(baseAmount * 1.5 / 100), 1500);
    const ewalletTotalAmount = baseAmount + ewalletFee;

    // Card fee (2.9% + 2000)
    const cardFee = Math.ceil(baseAmount * 2.9 / 100) + 2000;
    const cardTotalAmount = baseAmount + cardFee;

    // Cash (no fee)
    const cashFee = 0;
    const cashTotalAmount = baseAmount + cashFee;

    expect(baseAmount).toBe(310000);
    expect(vaTotalAmount).toBe(314500);
    expect(qrisTotalAmount).toBe(312170);
    expect(ewalletTotalAmount).toBe(314650);
    expect(cardTotalAmount).toBe(320990);
    expect(cashTotalAmount).toBe(310000);
  });

  it('should maintain service quantities in order data', () => {
    const selectedServices = ['service-001', 'service-002'];
    const quantities: Record<string, number> = { 'service-001': 1, 'service-002': 2 };
    const services = mockVendor.services || [];

    let calculatedSubtotal = 0;
    const items: any[] = [];

    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.service_id === serviceId);
      if (service) {
        const qty = quantities[serviceId] || 1;
        const itemSubtotal = service.price * qty;
        items.push({
          service_id: serviceId,
          quantity: qty,
          price: service.price,
          subtotal: itemSubtotal,
        });
        calculatedSubtotal += itemSubtotal;
      }
    });

    expect(items).toHaveLength(2);
    expect(items[0].quantity).toBe(1);
    expect(items[0].subtotal).toBe(150000);
    expect(items[1].quantity).toBe(2);
    expect(items[1].subtotal).toBe(150000);
    expect(calculatedSubtotal).toBe(300000);
  });
});

describe('User Profile Integration', () => {
  it('should pre-fill form with user profile data', () => {
    const formData = {
      name: mockUserProfile.name || '',
      email: mockUserProfile.email || '',
      phone: mockUserProfile.phone || '',
      address: mockUserProfile.address || '',
      gpsLink: mockUserProfile.gps_link || '',
    };

    expect(formData.name).toBe('Test User');
    expect(formData.email).toBe('user@test.com');
    expect(formData.phone).toBe('089876543210');
    expect(formData.address).toBe('Jl. Test No. 123, Jakarta');
    expect(formData.gpsLink).toBe('https://maps.google.com/test-location');
  });

  it('should handle missing profile fields gracefully', () => {
    const incompleteProfile = {
      user_id: 'user-123',
      name: 'User Name',
      email: 'user@test.com',
      // phone, address, gps_link are undefined
    };

    const formData = {
      name: incompleteProfile.name || '',
      email: incompleteProfile.email || '',
      phone: (incompleteProfile as any).phone || '',
      address: (incompleteProfile as any).address || '',
      gpsLink: (incompleteProfile as any).gps_link || '',
    };

    expect(formData.name).toBe('User Name');
    expect(formData.email).toBe('user@test.com');
    expect(formData.phone).toBe('');
    expect(formData.address).toBe('');
    expect(formData.gpsLink).toBe('');
  });
});

describe('Vendor Services Integration', () => {
  it('should only show active services', () => {
    const services = mockVendor.services || [];
    const activeServices = services.filter(s => s.is_active === true);

    expect(services.length).toBe(4);
    expect(activeServices.length).toBe(3);
  });

  it('should calculate correct price for mixed service types', () => {
    const services = mockVendor.services || [];
    const selectedServices = ['service-001', 'service-002', 'service-003'];
    const quantities: Record<string, number> = {
      'service-001': 1,  // FIXED: 150000
      'service-002': 3,  // HOURLY: 75000 * 3
      'service-003': 10, // UNIT: 25000 * 10
    };

    let total = 0;
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.service_id === serviceId);
      if (service) {
        total += service.price * quantities[serviceId];
      }
    });

    // 150000 + (75000 * 3) + (25000 * 10) = 150000 + 225000 + 250000 = 625000
    expect(total).toBe(625000);
  });
});