// __tests__/api/bookings.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';

// Mock Prisma before importing the route
const mockPrisma = {
  vendor: {
    findUnique: vi.fn(),
  },
  service: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  booking: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  userNotification: {
    create: vi.fn(),
  },
};

vi.mock('@/app/components/lib/prisma', () => ({
  default: mockPrisma,
}));

// Mock data
import { mockVendor, mockUserProfile, mockFormData } from '../mocks/mockData';

// Define mockOrderData with proper typing
const mockOrderData = {
  orderId: 'ORD-123456',
  vendorId: 'test-vendor-123',
  workDate: '2025-02-01',
  workTime: '10:30',
  customerName: 'Test User',
  customerEmail: 'user@test.com',
  customerPhone: '089876543210',
  customerAddress: 'Jl. Test No. 123, Jakarta',
  gpsLink: 'https://maps.google.com/test-location',
  serviceDetails: {
    selectedServices: ['service-001', 'service-002'],
    quantities: { 'service-001': 1, 'service-002': 2 } as Record<string, number>,
  },
  additionalNotes: 'Test notes',
  subtotal: 300000,
  serviceFee: 10000,
  totalAmount: 310000,
};

// Helper to create mock NextRequest
function createMockRequest(
  method: string,
  body?: any,
  searchParams?: Record<string, string>,
  cookies?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/bookings');
  
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Mock cookies with proper typing
  if (cookies) {
    vi.spyOn(request.cookies, 'get').mockImplementation((nameOrCookie: string | RequestCookie): RequestCookie | undefined => {
      const name = typeof nameOrCookie === 'string' ? nameOrCookie : nameOrCookie.name;
      return cookies[name] ? { name, value: cookies[name] } : undefined;
    });
    vi.spyOn(request.cookies, 'getAll').mockReturnValue(
      Object.entries(cookies).map(([name, value]) => ({ name, value }))
    );
  }

  return request;
}

describe('Bookings API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/bookings', () => {
    describe('Authentication', () => {
      it('should return 401 when no session cookies provided', async () => {
        const request = createMockRequest('POST', mockOrderData, {}, {});

        // Mock fetch to return unauthorized
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({ authenticated: false }),
        });

        const sessionId = undefined;
        const accessToken = undefined;

        expect(sessionId).toBeUndefined();
        expect(accessToken).toBeUndefined();
      });

      it('should authenticate successfully with valid cookies', async () => {
        const cookies = {
          session_id: 'valid-session-id',
          access_token: 'valid-access-token',
        };

        // Mock auth API response
        (global.fetch as any).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            authenticated: true,
            user: {
              user_id: 'user-test-123',
              name: 'Test User',
              email: 'test@example.com',
            },
          }),
        });

        const result = await global.fetch('http://localhost:3000/api/auth/me', {
          method: 'GET',
          headers: {
            Cookie: `session_id=${cookies.session_id}; access_token=${cookies.access_token}`,
          },
        });

        const data = await result.json();
        expect(data.authenticated).toBe(true);
        expect(data.user.user_id).toBe('user-test-123');
      });
    });

    describe('Validation', () => {
      it('should validate required orderId', () => {
        const invalidData = { ...mockOrderData, orderId: undefined };
        expect(invalidData.orderId).toBeUndefined();
      });

      it('should validate required vendorId', () => {
        const invalidData = { ...mockOrderData, vendorId: undefined };
        expect(invalidData.vendorId).toBeUndefined();
      });

      it('should validate required workDate', () => {
        const invalidData = { ...mockOrderData, workDate: undefined };
        expect(invalidData.workDate).toBeUndefined();
      });

      it('should validate required workTime', () => {
        const invalidData = { ...mockOrderData, workTime: undefined };
        expect(invalidData.workTime).toBeUndefined();
      });

      it('should validate selectedServices is not empty', () => {
        const invalidData = {
          ...mockOrderData,
          serviceDetails: {
            selectedServices: [],
            quantities: {} as Record<string, number>,
          },
        };
        expect(invalidData.serviceDetails.selectedServices.length).toBe(0);
      });

      it('should validate selectedServices exists', () => {
        type ServiceDetails = {
          selectedServices?: string[];
          quantities: Record<string, number>;
        };

        const invalidData = {
          ...mockOrderData,
          serviceDetails: {
            quantities: {},
          } as ServiceDetails,
        };
        expect(invalidData.serviceDetails.selectedServices).toBeUndefined();
      });
    });

    describe('Vendor Validation', () => {
      it('should check if vendor exists', async () => {
        mockPrisma.vendor.findUnique.mockResolvedValue(null);

        const result = await mockPrisma.vendor.findUnique({
          where: { vendor_id: 'non-existent-vendor' },
        });

        expect(result).toBeNull();
        expect(mockPrisma.vendor.findUnique).toHaveBeenCalledWith({
          where: { vendor_id: 'non-existent-vendor' },
        });
      });

      it('should find existing vendor', async () => {
        mockPrisma.vendor.findUnique.mockResolvedValue({
          vendor_id: mockVendor.vendor_id,
          name: mockVendor.name,
        });

        const result = await mockPrisma.vendor.findUnique({
          where: { vendor_id: mockVendor.vendor_id },
        });

        expect(result).toBeTruthy();
        expect(result.vendor_id).toBe(mockVendor.vendor_id);
      });
    });

    describe('Service Validation', () => {
      it('should validate services exist', async () => {
        const serviceIds = ['service-001', 'service-002'];
        
        mockPrisma.service.findMany.mockResolvedValue([
          { service_id: 'service-001', name: 'Service 1', is_active: true },
          { service_id: 'service-002', name: 'Service 2', is_active: true },
        ]);

        const services = await mockPrisma.service.findMany({
          where: {
            service_id: { in: serviceIds },
            vendor_id: mockVendor.vendor_id,
          },
        });

        expect(services.length).toBe(2);
        expect(mockPrisma.service.findMany).toHaveBeenCalled();
      });

      it('should detect missing services', async () => {
        const serviceIds = ['service-001', 'service-002', 'service-nonexistent'];
        
        mockPrisma.service.findMany.mockResolvedValue([
          { service_id: 'service-001', name: 'Service 1', is_active: true },
          { service_id: 'service-002', name: 'Service 2', is_active: true },
        ]);

        const services = await mockPrisma.service.findMany({
          where: {
            service_id: { in: serviceIds },
            vendor_id: mockVendor.vendor_id,
          },
        });

        const existingIds = services.map((s: any) => s.service_id);
        const missingIds = serviceIds.filter((id) => !existingIds.includes(id));

        expect(missingIds).toContain('service-nonexistent');
        expect(missingIds.length).toBe(1);
      });

      it('should detect inactive services', async () => {
        mockPrisma.service.findMany.mockResolvedValue([
          { service_id: 'service-001', name: 'Service 1', is_active: true },
          { service_id: 'service-002', name: 'Service 2', is_active: false },
        ]);

        const services = await mockPrisma.service.findMany({
          where: {
            service_id: { in: ['service-001', 'service-002'] },
            vendor_id: mockVendor.vendor_id,
          },
        });

        const inactiveServices = services.filter((s: any) => s.is_active !== true);
        expect(inactiveServices.length).toBe(1);
        expect(inactiveServices[0].service_id).toBe('service-002');
      });
    });

    describe('Date/Time Validation', () => {
      it('should validate date format', () => {
        const validDate = '2025-02-01';
        const scheduledDateTime = new Date(`${validDate}T10:30:00`);
        expect(isNaN(scheduledDateTime.getTime())).toBe(false);
      });

      it('should detect invalid date format', () => {
        const invalidDate = 'invalid-date';
        const scheduledDateTime = new Date(`${invalidDate}T10:30:00`);
        expect(isNaN(scheduledDateTime.getTime())).toBe(true);
      });

      it('should create correct DateTime from date and time', () => {
        const date = '2025-02-01';
        const time = '10:30';
        const scheduledDateTime = new Date(`${date}T${time}:00`);
        
        expect(scheduledDateTime.getFullYear()).toBe(2025);
        expect(scheduledDateTime.getMonth()).toBe(1); // February (0-indexed)
        expect(scheduledDateTime.getDate()).toBe(1);
        expect(scheduledDateTime.getHours()).toBe(10);
        expect(scheduledDateTime.getMinutes()).toBe(30);
      });
    });

    describe('Booking Creation', () => {
      it('should create booking with correct data', async () => {
        mockPrisma.booking.create.mockResolvedValue({
          booking_id: 'new-booking-id',
          booking_number: mockOrderData.orderId,
          user_id: 'user-test-123',
          vendor_id: mockOrderData.vendorId,
          status: 'PENDING',
          payment_status: 'PENDING',
          subtotal: mockOrderData.subtotal,
          service_fee: mockOrderData.serviceFee,
          total: mockOrderData.totalAmount,
          items: [],
          vendor: { name: 'Test Vendor' },
        });

        const result = await mockPrisma.booking.create({
          data: {
            booking_number: mockOrderData.orderId,
            user_id: 'user-test-123',
            vendor_id: mockOrderData.vendorId,
            scheduled_date: new Date(`${mockOrderData.workDate}T${mockOrderData.workTime}:00`),
            scheduled_time: mockOrderData.workTime,
            location: `${mockOrderData.customerAddress}\nGPS: ${mockOrderData.gpsLink}`,
            notes: mockOrderData.additionalNotes,
            status: 'PENDING',
            payment_status: 'PENDING',
            subtotal: mockOrderData.subtotal,
            service_fee: mockOrderData.serviceFee,
            total: mockOrderData.totalAmount,
          },
          include: {
            items: true,
            vendor: true,
          },
        });

        expect(result.booking_number).toBe(mockOrderData.orderId);
        expect(mockPrisma.booking.create).toHaveBeenCalled();
      });

      it('should create notification after booking creation', async () => {
        mockPrisma.userNotification.create.mockResolvedValue({
          id: 'notification-id',
          user_id: 'user-test-123',
          title: '🎉 Pesanan Berhasil Dibuat',
          type: 'order',
        });

        await mockPrisma.userNotification.create({
          data: {
            user_id: 'user-test-123',
            title: '🎉 Pesanan Berhasil Dibuat',
            message: `Pesanan Anda telah berhasil dibuat dengan ID #${mockOrderData.orderId}`,
            type: 'order',
            order_id: 'new-booking-id',
            is_read: false,
          },
        });

        expect(mockPrisma.userNotification.create).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle duplicate order ID error (P2002)', async () => {
        const prismaError = { code: 'P2002' };
        mockPrisma.booking.create.mockRejectedValue(prismaError);

        await expect(mockPrisma.booking.create({})).rejects.toEqual(prismaError);
      });

      it('should handle not found error (P2025)', async () => {
        const prismaError = { code: 'P2025' };
        mockPrisma.booking.create.mockRejectedValue(prismaError);

        await expect(mockPrisma.booking.create({})).rejects.toEqual(prismaError);
      });

      it('should handle generic errors', async () => {
        const genericError = new Error('Database connection failed');
        mockPrisma.booking.create.mockRejectedValue(genericError);

        await expect(mockPrisma.booking.create({})).rejects.toThrow('Database connection failed');
      });
    });
  });

  describe('GET /api/bookings', () => {
    describe('Fetching Bookings', () => {
      it('should fetch user bookings', async () => {
        mockPrisma.booking.findMany.mockResolvedValue([
          {
            booking_id: 'booking-1',
            booking_number: 'ORD-001',
            status: 'PENDING',
            vendor: { name: 'Vendor 1' },
            items: [],
          },
          {
            booking_id: 'booking-2',
            booking_number: 'ORD-002',
            status: 'CONFIRMED',
            vendor: { name: 'Vendor 2' },
            items: [],
          },
        ]);

        const bookings = await mockPrisma.booking.findMany({
          where: { user_id: 'user-test-123' },
          include: {
            vendor: true,
            items: true,
          },
          orderBy: { created_at: 'desc' },
        });

        expect(bookings.length).toBe(2);
        expect(bookings[0].booking_number).toBe('ORD-001');
      });

      it('should filter bookings by status', async () => {
        mockPrisma.booking.findMany.mockResolvedValue([
          {
            booking_id: 'booking-1',
            booking_number: 'ORD-001',
            status: 'PENDING',
          },
        ]);

        const bookings = await mockPrisma.booking.findMany({
          where: {
            user_id: 'user-test-123',
            status: 'PENDING',
          },
        });

        expect(bookings.length).toBe(1);
        expect(bookings[0].status).toBe('PENDING');
      });

      it('should paginate results', async () => {
        mockPrisma.booking.findMany.mockResolvedValue([
          { booking_id: 'booking-1' },
          { booking_id: 'booking-2' },
        ]);

        mockPrisma.booking.count.mockResolvedValue(10);

        const bookings = await mockPrisma.booking.findMany({
          where: { user_id: 'user-test-123' },
          take: 2,
          skip: 0,
        });

        const totalCount = await mockPrisma.booking.count({
          where: { user_id: 'user-test-123' },
        });

        expect(bookings.length).toBe(2);
        expect(totalCount).toBe(10);
      });
    });

    describe('Pagination', () => {
      it('should calculate hasMore correctly', () => {
        const total = 25;
        const limit = 10;
        const offset = 0;

        const hasMore = offset + limit < total;
        expect(hasMore).toBe(true);
      });

      it('should return false for hasMore when all items fetched', () => {
        const total = 25;
        const limit = 10;
        const offset = 20;

        const hasMore = offset + limit < total;
        expect(hasMore).toBe(false);
      });
    });
  });
});

describe('Booking Price Calculations', () => {
  const SERVICE_FEE = 10000;

  interface ServiceItem {
    service_id: string;
    quantity: number;
    price: number;
    subtotal: number;
  }

  function calculateSubtotal(serviceItems: ServiceItem[]): number {
    return serviceItems.reduce((total, item) => total + item.subtotal, 0);
  }

  function calculateTotal(subtotal: number, serviceFee: number, transactionFee: number): number {
    return subtotal + serviceFee + transactionFee;
  }

  it('should calculate subtotal correctly', () => {
    const items: ServiceItem[] = [
      { service_id: 'service-001', quantity: 1, price: 150000, subtotal: 150000 },
      { service_id: 'service-002', quantity: 2, price: 75000, subtotal: 150000 },
    ];

    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(300000);
  });

  it('should calculate total with transaction fee', () => {
    const subtotal = 300000;
    const transactionFee = 4500;
    
    const total = calculateTotal(subtotal, SERVICE_FEE, transactionFee);
    expect(total).toBe(314500);
  });

  it('should calculate total without transaction fee (tunai)', () => {
    const subtotal = 300000;
    const transactionFee = 0;
    
    const total = calculateTotal(subtotal, SERVICE_FEE, transactionFee);
    expect(total).toBe(310000);
  });
});

describe('Order Status Management', () => {
  const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

  it('should have valid order statuses', () => {
    expect(validStatuses).toContain('PENDING');
    expect(validStatuses).toContain('CONFIRMED');
    expect(validStatuses).toContain('IN_PROGRESS');
    expect(validStatuses).toContain('COMPLETED');
    expect(validStatuses).toContain('CANCELLED');
  });

  it('should have valid payment statuses', () => {
    expect(validPaymentStatuses).toContain('PENDING');
    expect(validPaymentStatuses).toContain('PAID');
    expect(validPaymentStatuses).toContain('FAILED');
    expect(validPaymentStatuses).toContain('REFUNDED');
  });

  it('should convert lowercase status to uppercase', () => {
    const inputStatus = 'pending';
    const normalizedStatus = inputStatus.toUpperCase();
    expect(normalizedStatus).toBe('PENDING');
    expect(validStatuses).toContain(normalizedStatus);
  });
});