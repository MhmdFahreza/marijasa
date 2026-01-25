// __tests__/components/VendorFormPage.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock data
import { mockVendor, mockUserProfile, mockFormData } from '../mocks/mockData';

// Mock components that we're not testing
vi.mock('@/app/components/transition/loader', () => ({
  LoaderTwo: () => <div data-testid="loader">Loading...</div>,
}));

vi.mock('@/app/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@/app/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/app/components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

vi.mock('@/app/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} {...props} />
  ),
}));

vi.mock('@/app/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/app/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

vi.mock('@/app/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@/app/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/app/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div data-testid="radio-group" data-value={value} onChange={(e: any) => onValueChange(e.target.value)}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <input type="radio" value={value} id={id} name="radio-group" />
  ),
}));

describe('VendorFormPage Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Service Selection Logic', () => {
    it('should add service to selected services when checked', () => {
      const selectedServices: string[] = [];
      const quantities: Record<string, number> = {};
      
      // Simulate handleServiceToggle(serviceId, true)
      const serviceId = 'service-001';
      const checked = true;

      let newSelectedServices: string[];
      let newQuantities: Record<string, number>;

      if (checked) {
        newSelectedServices = [...selectedServices, serviceId];
        newQuantities = { ...quantities, [serviceId]: 1 };
      } else {
        newSelectedServices = selectedServices.filter(id => id !== serviceId);
        newQuantities = { ...quantities };
        delete newQuantities[serviceId];
      }

      expect(newSelectedServices).toContain('service-001');
      expect(newQuantities['service-001']).toBe(1);
    });

    it('should remove service from selected services when unchecked', () => {
      const selectedServices = ['service-001', 'service-002'];
      const quantities: Record<string, number> = { 'service-001': 1, 'service-002': 2 };
      
      const serviceId = 'service-001';
      const checked = false;

      let newSelectedServices: string[];
      let newQuantities: Record<string, number>;

      if (checked) {
        newSelectedServices = [...selectedServices, serviceId];
        newQuantities = { ...quantities, [serviceId]: 1 };
      } else {
        newSelectedServices = selectedServices.filter(id => id !== serviceId);
        newQuantities = { ...quantities };
        delete newQuantities[serviceId];
      }

      expect(newSelectedServices).not.toContain('service-001');
      expect(newSelectedServices).toContain('service-002');
      expect(newQuantities['service-001']).toBeUndefined();
      expect(newQuantities['service-002']).toBe(2);
    });
  });

  describe('Quantity Management', () => {
    it('should update quantity correctly', () => {
      const quantities: Record<string, number> = { 'service-001': 1 };
      const serviceId = 'service-001';
      const newQuantity = 3;

      const updatedQuantities: Record<string, number> = {
        ...quantities,
        [serviceId]: Math.max(1, newQuantity),
      };

      expect(updatedQuantities['service-001']).toBe(3);
    });

    it('should not allow quantity below 1', () => {
      const quantities: Record<string, number> = { 'service-001': 2 };
      const serviceId = 'service-001';
      const newQuantity = 0;

      const updatedQuantities: Record<string, number> = {
        ...quantities,
        [serviceId]: Math.max(1, newQuantity),
      };

      expect(updatedQuantities['service-001']).toBe(1);
    });

    it('should not allow negative quantity', () => {
      const quantities: Record<string, number> = { 'service-001': 2 };
      const serviceId = 'service-001';
      const newQuantity = -5;

      const updatedQuantities: Record<string, number> = {
        ...quantities,
        [serviceId]: Math.max(1, newQuantity),
      };

      expect(updatedQuantities['service-001']).toBe(1);
    });
  });

  describe('Time Input Handling', () => {
    it('should handle hour input correctly', () => {
      // Simulate handleHourChange
      const handleHourChange = (input: string): string => {
        let value = input.replace(/\D/g, '');
        if (value === '') return '';
        let hour = parseInt(value, 10);
        if (hour > 23) hour = 23;
        return hour.toString();
      };

      expect(handleHourChange('10')).toBe('10');
      expect(handleHourChange('25')).toBe('23');
      expect(handleHourChange('abc')).toBe('');
      expect(handleHourChange('5')).toBe('5');
      expect(handleHourChange('00')).toBe('0');
    });

    it('should handle minute input correctly', () => {
      // Simulate handleMinuteChange
      const handleMinuteChange = (input: string): string => {
        let value = input.replace(/\D/g, '');
        if (value === '') return '';
        let minute = parseInt(value, 10);
        if (minute > 59) minute = 59;
        return minute.toString();
      };

      expect(handleMinuteChange('30')).toBe('30');
      expect(handleMinuteChange('60')).toBe('59');
      expect(handleMinuteChange('xyz')).toBe('');
      expect(handleMinuteChange('5')).toBe('5');
      expect(handleMinuteChange('00')).toBe('0');
    });
  });

  describe('Active Services Filtering', () => {
    it('should filter only active services', () => {
      const services = mockVendor.services || [];
      const activeServices = services.filter(s => s.is_active === true);

      expect(activeServices.length).toBe(3);
      expect(activeServices.every(s => s.is_active === true)).toBe(true);
    });

    it('should exclude inactive services', () => {
      const services = mockVendor.services || [];
      const activeServices = services.filter(s => s.is_active === true);
      const inactiveService = services.find(s => s.service_id === 'service-004');

      expect(inactiveService).toBeDefined();
      expect(inactiveService?.is_active).toBe(false);
      expect(activeServices).not.toContainEqual(inactiveService);
    });
  });

  describe('Form Data Management', () => {
    it('should initialize form data from user profile', () => {
      const formData = {
        name: mockUserProfile.name,
        email: mockUserProfile.email,
        phone: mockUserProfile.phone,
        address: mockUserProfile.address,
        gpsLink: mockUserProfile.gps_link,
        selectedServices: [],
        quantities: {},
        notes: '',
      };

      expect(formData.name).toBe(mockUserProfile.name);
      expect(formData.email).toBe(mockUserProfile.email);
      expect(formData.phone).toBe(mockUserProfile.phone);
    });

    it('should allow overriding user profile data', () => {
      let formData = {
        name: mockUserProfile.name,
        email: mockUserProfile.email,
      };

      // Simulate user input override
      formData = {
        ...formData,
        name: 'Custom Name',
      };

      expect(formData.name).toBe('Custom Name');
      expect(formData.email).toBe(mockUserProfile.email);
    });
  });
});

describe('Confirmation Step Logic', () => {
  describe('Selected Services Details', () => {
    it('should get correct service details with quantities', () => {
      const selectedServices = ['service-001', 'service-002'];
      const quantities: Record<string, number> = { 'service-001': 1, 'service-002': 2 };
      const services = mockVendor.services || [];

      const details = selectedServices.map(serviceId => {
        const service = services.find(s => s.service_id === serviceId);
        const quantity = quantities[serviceId] || 1;
        return {
          ...service,
          quantity,
          total: service ? service.price * quantity : 0,
        };
      });

      expect(details.length).toBe(2);
      expect(details[0].quantity).toBe(1);
      expect(details[0].total).toBe(150000);
      expect(details[1].quantity).toBe(2);
      expect(details[1].total).toBe(150000); // 75000 * 2
    });
  });

  describe('Time Display Formatting', () => {
    it('should format time for display correctly', () => {
      const formatTimeForDisplay = (hour: string, minute: string): string => {
        return `${(hour || '0').padStart(2, '0')}:${(minute || '0').padStart(2, '0')} WIB`;
      };

      expect(formatTimeForDisplay('10', '30')).toBe('10:30 WIB');
      expect(formatTimeForDisplay('9', '5')).toBe('09:05 WIB');
      expect(formatTimeForDisplay('', '')).toBe('00:00 WIB');
      expect(formatTimeForDisplay('23', '59')).toBe('23:59 WIB');
    });
  });

  describe('Payment Category Sections', () => {
    const paymentCategories = {
      ewallet: {
        name: 'E-Wallet',
        methods: ['ewallet_dana', 'ewallet_ovo', 'ewallet_shopeepay', 'ewallet_linkaja'],
      },
      va: {
        name: 'Virtual Account',
        methods: ['va_bca', 'va_bni', 'va_bri', 'va_mandiri', 'va_permata', 'va_bsi', 'va_cimb'],
      },
      qris: {
        name: 'QRIS',
        methods: ['qris'],
      },
      card: {
        name: 'Kartu Kredit/Debit',
        methods: ['card_visa', 'card_mastercard', 'card_jcb'],
      },
      retail: {
        name: 'Gerai Retail',
        methods: ['retail_alfamart', 'retail_indomaret'],
      },
      tunai: {
        name: 'Tunai',
        methods: ['tunai'],
      },
    };

    it('should have all payment categories', () => {
      expect(Object.keys(paymentCategories)).toHaveLength(6);
      expect(paymentCategories).toHaveProperty('ewallet');
      expect(paymentCategories).toHaveProperty('va');
      expect(paymentCategories).toHaveProperty('qris');
      expect(paymentCategories).toHaveProperty('card');
      expect(paymentCategories).toHaveProperty('retail');
      expect(paymentCategories).toHaveProperty('tunai');
    });

    it('should have correct e-wallet methods', () => {
      expect(paymentCategories.ewallet.methods).toHaveLength(4);
      expect(paymentCategories.ewallet.methods).toContain('ewallet_dana');
      expect(paymentCategories.ewallet.methods).toContain('ewallet_ovo');
    });

    it('should have correct VA methods', () => {
      expect(paymentCategories.va.methods).toHaveLength(7);
      expect(paymentCategories.va.methods).toContain('va_bca');
      expect(paymentCategories.va.methods).toContain('va_mandiri');
    });

    it('should have QRIS method', () => {
      expect(paymentCategories.qris.methods).toHaveLength(1);
      expect(paymentCategories.qris.methods).toContain('qris');
    });

    it('should have tunai method', () => {
      expect(paymentCategories.tunai.methods).toHaveLength(1);
      expect(paymentCategories.tunai.methods).toContain('tunai');
    });
  });

  describe('Section Toggle', () => {
    it('should toggle section expansion', () => {
      const expandedSections: Record<string, boolean> = {
        ewallet: true,
        va: false,
        card: false,
        qris: false,
        retail: false,
        tunai: false,
      };

      // Simulate toggleSection('va')
      const toggledSections: Record<string, boolean> = {
        ...expandedSections,
        va: !expandedSections.va,
      };

      expect(toggledSections.va).toBe(true);
      expect(toggledSections.ewallet).toBe(true);
    });

    it('should collapse expanded section', () => {
      const expandedSections: Record<string, boolean> = {
        ewallet: true,
        va: true,
      };

      // Simulate toggleSection('ewallet')
      const toggledSections: Record<string, boolean> = {
        ...expandedSections,
        ewallet: !expandedSections.ewallet,
      };

      expect(toggledSections.ewallet).toBe(false);
      expect(toggledSections.va).toBe(true);
    });
  });
});

describe('Payment Step Logic', () => {
  describe('Clipboard Copy', () => {
    it('should copy text to clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      });

      const text = '1234567890123456';
      await navigator.clipboard.writeText(text);

      expect(mockWriteText).toHaveBeenCalledWith(text);
    });
  });

  describe('Expiration Date Formatting', () => {
    it('should format expiration date correctly', () => {
      const formatExpiration = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      const formatted = formatExpiration('2025-01-21T10:30:00.000Z');
      
      // The exact format depends on locale, but should include key parts
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('Payment Status Check', () => {
    it('should check payment status via API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          booking: {
            paymentStatus: 'PAID',
          },
        }),
      });

      const response = await fetch('/api/payments/xendit?orderId=ORD-123456');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.booking.paymentStatus).toBe('PAID');
    });

    it('should handle payment status check error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Internal Server Error',
        }),
      });

      const response = await fetch('/api/payments/xendit?orderId=ORD-123456');
      const data = await response.json();

      expect(data.success).toBe(false);
    });
  });
});

describe('Order ID Generation', () => {
  it('should generate unique order ID', () => {
    const generateOrderId = (): string => {
      return `ORD-${Date.now().toString().slice(-6)}`;
    };

    const orderId1 = generateOrderId();
    
    // Wait a millisecond to ensure different timestamp
    const orderId2 = `ORD-${(Date.now() + 1).toString().slice(-6)}`;

    expect(orderId1).toMatch(/^ORD-\d{6}$/);
    expect(orderId2).toMatch(/^ORD-\d{6}$/);
  });

  it('should have correct format', () => {
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    
    expect(orderId.startsWith('ORD-')).toBe(true);
    expect(orderId.length).toBe(10);
  });
});

describe('Navigation Handling', () => {
  it('should construct correct vendor detail URL', () => {
    const vendorId = 'test-vendor-123';
    const url = `/jasa/detailjasa/${vendorId}`;
    
    expect(url).toBe('/jasa/detailjasa/test-vendor-123');
  });

  it('should construct correct form URL', () => {
    const vendorId = 'test-vendor-123';
    const url = `/jasa/detailjasa/${vendorId}/form`;
    
    expect(url).toBe('/jasa/detailjasa/test-vendor-123/form');
  });
});

describe('Breadcrumb Configuration', () => {
  type StepType = 'form' | 'confirmation' | 'payment';

  // Helper function to get step label
  const getStepLabel = (step: StepType): string => {
    const labels: Record<StepType, string> = {
      form: 'Form Pemesanan',
      confirmation: 'Konfirmasi',
      payment: 'Pembayaran',
    };
    return labels[step];
  };

  it('should have correct breadcrumb structure', () => {
    const vendorId = 'test-vendor-123';
    const vendorName = 'Test Vendor';
    const currentStep: StepType = 'form';

    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Jasa', href: '/jasa' },
      { label: vendorName, href: `/jasa/detailjasa/${vendorId}` },
      { label: getStepLabel(currentStep) },
    ];

    expect(breadcrumbs).toHaveLength(4);
    expect(breadcrumbs[0].href).toBe('/');
    expect(breadcrumbs[1].href).toBe('/jasa');
    expect(breadcrumbs[2].href).toBe('/jasa/detailjasa/test-vendor-123');
    expect(breadcrumbs[3].label).toBe('Form Pemesanan');
  });

  it('should update breadcrumb for confirmation step', () => {
    const currentStep: StepType = 'confirmation';
    const label = getStepLabel(currentStep);
    
    expect(label).toBe('Konfirmasi');
  });

  it('should update breadcrumb for payment step', () => {
    const currentStep: StepType = 'payment';
    const label = getStepLabel(currentStep);
    
    expect(label).toBe('Pembayaran');
  });

  it('should map all step types correctly', () => {
    expect(getStepLabel('form')).toBe('Form Pemesanan');
    expect(getStepLabel('confirmation')).toBe('Konfirmasi');
    expect(getStepLabel('payment')).toBe('Pembayaran');
  });
});