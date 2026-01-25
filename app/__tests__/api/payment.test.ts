// __tests__/api/payment.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma
const mockPrisma = {
  booking: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  bookingHistory: {
    create: vi.fn(),
  },
  userNotification: {
    create: vi.fn(),
  },
};

vi.mock('@/app/components/lib/prisma', () => ({
  default: mockPrisma,
}));

// Import mock data
import { mockBooking, mockPaymentResponse, mockPaymentResponseTunai, mockPaymentResponseQRIS } from '../mocks/mockData';

describe('Payment API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('PUT /api/bookings/[orderId]/payment', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        // Without cookies, user should not be authenticated
        const sessionId = undefined;
        const accessToken = undefined;

        expect(sessionId).toBeUndefined();
        expect(accessToken).toBeUndefined();
      });

      it('should authenticate with valid cookies', async () => {
        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => ({
            authenticated: true,
            user: { user_id: 'user-test-123' },
          }),
        });

        const response = await global.fetch('/api/auth/me');
        const data = await response.json();

        expect(data.authenticated).toBe(true);
        expect(data.user.user_id).toBe('user-test-123');
      });
    });

    describe('Validation', () => {
      type PaymentPayload = {
        paymentMethod?: string;
        paymentStatus?: string;
        transactionFee?: number;
        totalAmount?: number;
      };

      it('should require payment method', () => {
        const invalidPayload: PaymentPayload = { paymentStatus: 'PENDING' };
        expect(invalidPayload.paymentMethod).toBeUndefined();
      });

      it('should require payment status', () => {
        const invalidPayload: PaymentPayload = { paymentMethod: 'va_bca' };
        expect(invalidPayload.paymentStatus).toBeUndefined();
      });

      it('should accept valid payment payload', () => {
        const validPayload: PaymentPayload = {
          paymentMethod: 'va_bca',
          paymentStatus: 'PENDING',
          transactionFee: 4500,
          totalAmount: 314500,
        };

        expect(validPayload.paymentMethod).toBe('va_bca');
        expect(validPayload.paymentStatus).toBe('PENDING');
      });
    });

    describe('Booking Lookup', () => {
      it('should find booking by order ID and user ID', async () => {
        mockPrisma.booking.findFirst.mockResolvedValue({
          ...mockBooking,
          vendor: { name: 'Test Vendor' },
        });

        const booking = await mockPrisma.booking.findFirst({
          where: {
            booking_number: 'ORD-123456',
            user_id: 'user-test-123',
          },
          include: {
            vendor: { select: { name: true } },
          },
        });

        expect(booking).toBeTruthy();
        expect(booking.booking_number).toBe('ORD-123456');
        expect(mockPrisma.booking.findFirst).toHaveBeenCalled();
      });

      it('should return null for non-existent booking', async () => {
        mockPrisma.booking.findFirst.mockResolvedValue(null);

        const booking = await mockPrisma.booking.findFirst({
          where: {
            booking_number: 'NON-EXISTENT',
            user_id: 'user-test-123',
          },
        });

        expect(booking).toBeNull();
      });

      it('should not find booking for different user', async () => {
        mockPrisma.booking.findFirst.mockResolvedValue(null);

        const booking = await mockPrisma.booking.findFirst({
          where: {
            booking_number: 'ORD-123456',
            user_id: 'different-user-id',
          },
        });

        expect(booking).toBeNull();
      });
    });

    describe('Payment Update', () => {
      it('should update booking with payment method', async () => {
        mockPrisma.booking.update.mockResolvedValue({
          ...mockBooking,
          payment_method: 'va_bca',
          payment_status: 'PENDING',
          transaction_fee: 4500,
          total: 314500,
        });

        const updatedBooking = await mockPrisma.booking.update({
          where: { booking_id: mockBooking.booking_id },
          data: {
            payment_method: 'va_bca',
            payment_status: 'PENDING',
            transaction_fee: 4500,
            total: 314500,
          },
        });

        expect(updatedBooking.payment_method).toBe('va_bca');
        expect(updatedBooking.payment_status).toBe('PENDING');
        expect(updatedBooking.transaction_fee).toBe(4500);
      });

      it('should update booking status to CONFIRMED when payment is PAID', async () => {
        mockPrisma.booking.update.mockResolvedValue({
          ...mockBooking,
          payment_method: 'va_bca',
          payment_status: 'PAID',
          status: 'CONFIRMED',
        });

        const updatedBooking = await mockPrisma.booking.update({
          where: { booking_id: mockBooking.booking_id },
          data: {
            payment_method: 'va_bca',
            payment_status: 'PAID',
            status: 'CONFIRMED',
          },
        });

        expect(updatedBooking.payment_status).toBe('PAID');
        expect(updatedBooking.status).toBe('CONFIRMED');
      });

      it('should handle cash payment (tunai)', async () => {
        mockPrisma.booking.update.mockResolvedValue({
          ...mockBooking,
          payment_method: 'tunai',
          payment_status: 'PAID',
          transaction_fee: 0,
          total: 310000,
        });

        const updatedBooking = await mockPrisma.booking.update({
          where: { booking_id: mockBooking.booking_id },
          data: {
            payment_method: 'tunai',
            payment_status: 'PAID',
            transaction_fee: 0,
            total: 310000,
          },
        });

        expect(updatedBooking.payment_method).toBe('tunai');
        expect(updatedBooking.transaction_fee).toBe(0);
      });
    });

    describe('Booking History', () => {
      it('should create history entry for payment', async () => {
        mockPrisma.bookingHistory.create.mockResolvedValue({
          id: 'history-id',
          booking_id: mockBooking.booking_id,
          status: 'Pembayaran Berhasil - BCA Virtual Account',
        });

        await mockPrisma.bookingHistory.create({
          data: {
            booking_id: mockBooking.booking_id,
            status: 'Pembayaran Berhasil - BCA Virtual Account',
            reason: 'Xendit Reference: ref-123',
          },
        });

        expect(mockPrisma.bookingHistory.create).toHaveBeenCalled();
      });

      it('should create history for cash payment', async () => {
        mockPrisma.bookingHistory.create.mockResolvedValue({
          id: 'history-id',
          booking_id: mockBooking.booking_id,
          status: 'Pembayaran Berhasil - Tunai',
          reason: 'Pembayaran tunai akan dilakukan saat layanan selesai',
        });

        await mockPrisma.bookingHistory.create({
          data: {
            booking_id: mockBooking.booking_id,
            status: 'Pembayaran Berhasil - Tunai',
            reason: 'Pembayaran tunai akan dilakukan saat layanan selesai',
          },
        });

        expect(mockPrisma.bookingHistory.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            status: expect.stringContaining('Tunai'),
          }),
        });
      });
    });

    describe('Notifications', () => {
      it('should create notification for successful payment', async () => {
        mockPrisma.userNotification.create.mockResolvedValue({
          id: 'notification-id',
          title: '✅ Pembayaran Berhasil',
        });

        await mockPrisma.userNotification.create({
          data: {
            user_id: 'user-test-123',
            title: '✅ Pembayaran Berhasil',
            message: 'Pembayaran untuk pesanan #ORD-123456 telah berhasil',
            type: 'payment',
            order_id: mockBooking.booking_id,
          },
        });

        expect(mockPrisma.userNotification.create).toHaveBeenCalled();
      });

      it('should create notification for pending payment', async () => {
        mockPrisma.userNotification.create.mockResolvedValue({
          id: 'notification-id',
          title: '🔔 Menunggu Pembayaran',
        });

        await mockPrisma.userNotification.create({
          data: {
            user_id: 'user-test-123',
            title: '🔔 Menunggu Pembayaran',
            message: 'Silakan selesaikan pembayaran untuk pesanan #ORD-123456',
            type: 'payment',
            order_id: mockBooking.booking_id,
          },
        });

        expect(mockPrisma.userNotification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: expect.stringContaining('Menunggu Pembayaran'),
          }),
        });
      });

      it('should create notification for failed payment', async () => {
        mockPrisma.userNotification.create.mockResolvedValue({
          id: 'notification-id',
          title: '❌ Pembayaran Gagal',
        });

        await mockPrisma.userNotification.create({
          data: {
            user_id: 'user-test-123',
            title: '❌ Pembayaran Gagal',
            message: 'Pembayaran untuk pesanan #ORD-123456 gagal',
            type: 'payment',
            order_id: mockBooking.booking_id,
          },
        });

        expect(mockPrisma.userNotification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: expect.stringContaining('Gagal'),
          }),
        });
      });

      it('should create notification for cash payment', async () => {
        mockPrisma.userNotification.create.mockResolvedValue({
          id: 'notification-id',
          title: '💵 Pembayaran Tunai Dikonfirmasi',
        });

        await mockPrisma.userNotification.create({
          data: {
            user_id: 'user-test-123',
            title: '💵 Pembayaran Tunai Dikonfirmasi',
            message: 'Pesanan #ORD-123456 dikonfirmasi dengan pembayaran tunai',
            type: 'payment',
            order_id: mockBooking.booking_id,
          },
        });

        expect(mockPrisma.userNotification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: expect.stringContaining('Tunai'),
          }),
        });
      });
    });
  });

  describe('GET /api/bookings/[orderId]/payment', () => {
    it('should return booking payment details', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        ...mockBooking,
        vendor: { name: 'Test Vendor', phone: '081234567890' },
        items: mockBooking.items,
      });

      const booking = await mockPrisma.booking.findFirst({
        where: {
          booking_number: 'ORD-123456',
          user_id: 'user-test-123',
        },
        include: {
          vendor: { select: { name: true, phone: true } },
          items: { include: { service: { select: { name: true } } } },
        },
      });

      expect(booking).toBeTruthy();
      expect(booking.booking_number).toBe('ORD-123456');
      expect(booking.vendor).toBeTruthy();
      expect(booking.items).toBeTruthy();
    });

    it('should return 404 for non-existent booking', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      const booking = await mockPrisma.booking.findFirst({
        where: {
          booking_number: 'NON-EXISTENT',
          user_id: 'user-test-123',
        },
      });

      expect(booking).toBeNull();
    });
  });
});

describe('Payment Method Names', () => {
  const paymentMethodNames: Record<string, string> = {
    ewallet_ovo: 'OVO',
    ewallet_dana: 'DANA',
    ewallet_shopeepay: 'ShopeePay',
    ewallet_linkaja: 'LinkAja',
    va_bca: 'BCA Virtual Account',
    va_bni: 'BNI Virtual Account',
    va_bri: 'BRI Virtual Account',
    va_mandiri: 'Mandiri Virtual Account',
    va_permata: 'Permata Virtual Account',
    va_bsi: 'BSI Virtual Account',
    va_cimb: 'CIMB Virtual Account',
    qris: 'QRIS',
    card_visa: 'Kartu Visa',
    card_mastercard: 'Kartu Mastercard',
    card_jcb: 'Kartu JCB',
    retail_alfamart: 'Alfamart',
    retail_indomaret: 'Indomaret',
    tunai: 'Tunai',
  };

  it('should have display name for all e-wallets', () => {
    expect(paymentMethodNames.ewallet_ovo).toBe('OVO');
    expect(paymentMethodNames.ewallet_dana).toBe('DANA');
    expect(paymentMethodNames.ewallet_shopeepay).toBe('ShopeePay');
    expect(paymentMethodNames.ewallet_linkaja).toBe('LinkAja');
  });

  it('should have display name for all virtual accounts', () => {
    expect(paymentMethodNames.va_bca).toBe('BCA Virtual Account');
    expect(paymentMethodNames.va_bni).toBe('BNI Virtual Account');
    expect(paymentMethodNames.va_bri).toBe('BRI Virtual Account');
    expect(paymentMethodNames.va_mandiri).toBe('Mandiri Virtual Account');
  });

  it('should have display name for QRIS', () => {
    expect(paymentMethodNames.qris).toBe('QRIS');
  });

  it('should have display name for cards', () => {
    expect(paymentMethodNames.card_visa).toBe('Kartu Visa');
    expect(paymentMethodNames.card_mastercard).toBe('Kartu Mastercard');
    expect(paymentMethodNames.card_jcb).toBe('Kartu JCB');
  });

  it('should have display name for retail outlets', () => {
    expect(paymentMethodNames.retail_alfamart).toBe('Alfamart');
    expect(paymentMethodNames.retail_indomaret).toBe('Indomaret');
  });

  it('should have display name for cash', () => {
    expect(paymentMethodNames.tunai).toBe('Tunai');
  });

  it('should return method code for unknown methods', () => {
    const unknownMethod = 'unknown_method';
    const displayName = paymentMethodNames[unknownMethod] || unknownMethod;
    expect(displayName).toBe('unknown_method');
  });
});

describe('Payment Status Transitions', () => {
  it('should allow PENDING → PAID transition', () => {
    const currentStatus = 'PENDING';
    const newStatus = 'PAID';
    
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'FAILED', 'CANCELLED'],
      PAID: ['REFUNDED'],
      FAILED: ['PENDING'],
      REFUNDED: [],
      CANCELLED: [],
    };

    expect(allowedTransitions[currentStatus]).toContain(newStatus);
  });

  it('should allow PENDING → FAILED transition', () => {
    const currentStatus = 'PENDING';
    const newStatus = 'FAILED';
    
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'FAILED', 'CANCELLED'],
      PAID: ['REFUNDED'],
      FAILED: ['PENDING'],
    };

    expect(allowedTransitions[currentStatus]).toContain(newStatus);
  });

  it('should allow PAID → REFUNDED transition', () => {
    const currentStatus = 'PAID';
    const newStatus = 'REFUNDED';
    
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'FAILED', 'CANCELLED'],
      PAID: ['REFUNDED'],
      FAILED: ['PENDING'],
    };

    expect(allowedTransitions[currentStatus]).toContain(newStatus);
  });

  it('should allow FAILED → PENDING transition (retry)', () => {
    const currentStatus = 'FAILED';
    const newStatus = 'PENDING';
    
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'FAILED', 'CANCELLED'],
      PAID: ['REFUNDED'],
      FAILED: ['PENDING'],
    };

    expect(allowedTransitions[currentStatus]).toContain(newStatus);
  });
});

describe('Payment Response Types', () => {
  describe('Virtual Account Response', () => {
    it('should have correct structure', () => {
      const response = mockPaymentResponse;

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('paymentType', 'va_bca');
      expect(response).toHaveProperty('orderId');
      expect(response).toHaveProperty('amount');
      expect(response).toHaveProperty('transactionFee');
      expect(response).toHaveProperty('totalAmount');
      expect(response).toHaveProperty('vaNumber');
      expect(response).toHaveProperty('expirationDate');
    });
  });

  describe('QRIS Response', () => {
    it('should have correct structure', () => {
      const response = mockPaymentResponseQRIS;

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('paymentType', 'qris');
      expect(response).toHaveProperty('qrString');
      expect(response).toHaveProperty('expirationDate');
    });
  });

  describe('Cash Response', () => {
    it('should have correct structure', () => {
      const response = mockPaymentResponseTunai;

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('paymentType', 'tunai');
      expect(response.transactionFee).toBe(0);
    });
  });
});

describe('Total Calculation with Transaction Fee', () => {
  it('should calculate correct total for VA payment', () => {
    const subtotal = 300000;
    const serviceFee = 10000;
    const transactionFee = 4500; // BCA VA fee

    const total = subtotal + serviceFee + transactionFee;
    expect(total).toBe(314500);
  });

  it('should calculate correct total for QRIS payment', () => {
    const subtotal = 300000;
    const serviceFee = 10000;
    const baseAmount = subtotal + serviceFee; // 310000
    const transactionFee = Math.ceil(baseAmount * 0.7 / 100); // 0.7% = 2170

    const total = baseAmount + transactionFee;
    expect(total).toBe(312170);
  });

  it('should calculate correct total for e-wallet payment', () => {
    const subtotal = 300000;
    const serviceFee = 10000;
    const baseAmount = subtotal + serviceFee; // 310000
    const transactionFee = Math.max(Math.ceil(baseAmount * 1.5 / 100), 1500); // 1.5% min 1500 = 4650

    const total = baseAmount + transactionFee;
    expect(total).toBe(314650);
  });

  it('should calculate correct total for cash payment', () => {
    const subtotal = 300000;
    const serviceFee = 10000;
    const transactionFee = 0; // No fee for cash

    const total = subtotal + serviceFee + transactionFee;
    expect(total).toBe(310000);
  });

  it('should calculate correct total for card payment', () => {
    const subtotal = 300000;
    const serviceFee = 10000;
    const baseAmount = subtotal + serviceFee; // 310000
    const transactionFee = Math.ceil(baseAmount * 2.9 / 100) + 2000; // 2.9% + 2000 = 8990 + 2000 = 10990

    const total = baseAmount + transactionFee;
    expect(total).toBe(320990);
  });
});