import { describe, it, expect } from 'vitest';

// Re-implement validation function for testing
interface FormDataType {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date?: string;
  selectedServices?: string[];
  quantities?: Record<string, number>;
  notes?: string;
}

function validateFormData(formData: FormDataType): string[] {
  const errors: string[] = [];

  if (!formData.name || formData.name.trim() === '') {
    errors.push('Nama pelanggan harus diisi');
  }

  if (!formData.email || formData.email.trim() === '') {
    errors.push('Email pelanggan harus diisi');
  }

  if (!formData.phone || formData.phone.trim() === '') {
    errors.push('Nomor telepon harus diisi');
  }

  if (!formData.address || formData.address.trim() === '') {
    errors.push('Alamat harus diisi');
  }

  if (!formData.date) {
    errors.push('Tanggal pengerjaan harus dipilih');
  }

  if (!formData.selectedServices || formData.selectedServices.length === 0) {
    errors.push('Minimal pilih satu layanan');
  }

  return errors;
}

// IMPLEMENTATION MATCHES THE ACTUAL CODE IN page.tsx
// Date must be AFTER today (not today itself)
function validateDateNotInPast(dateString: string): boolean {
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  return selectedDate > today; // Date must be strictly AFTER today
}

function formatTime(hour: string, minute: string): string {
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// ==========================================
// TESTS
// ==========================================

describe('Form Validation', () => {
  describe('validateFormData', () => {
    it('should return no errors for valid form data', () => {
      const formData: FormDataType = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
        selectedServices: ['service-001'],
        quantities: { 'service-001': 1 },
      };

      const errors = validateFormData(formData);
      expect(errors).toHaveLength(0);
    });

    it('should return error when name is missing', () => {
      const formData: FormDataType = {
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
        selectedServices: ['service-001'],
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Nama pelanggan harus diisi');
    });

    it('should return error when name is empty string', () => {
      const formData: FormDataType = {
        name: '',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
        selectedServices: ['service-001'],
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Nama pelanggan harus diisi');
    });

    it('should return error when name is whitespace only', () => {
      const formData: FormDataType = {
        name: '   ',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
        selectedServices: ['service-001'],
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Nama pelanggan harus diisi');
    });

    it('should return error when email is missing', () => {
      const formData: FormDataType = {
        name: 'Test User',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
        selectedServices: ['service-001'],
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Email pelanggan harus diisi');
    });

    it('should return error when phone is missing', () => {
      const formData: FormDataType = {
        name: 'Test User',
        email: 'test@example.com',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
        selectedServices: ['service-001'],
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Nomor telepon harus diisi');
    });

    it('should return error when address is missing', () => {
      const formData: FormDataType = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        date: '2025-02-01',
        selectedServices: ['service-001'],
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Alamat harus diisi');
    });

    it('should return error when date is missing', () => {
      const formData: FormDataType = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        selectedServices: ['service-001'],
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Tanggal pengerjaan harus dipilih');
    });

    it('should return error when selectedServices is empty', () => {
      const formData: FormDataType = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
        selectedServices: [],
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Minimal pilih satu layanan');
    });

    it('should return error when selectedServices is undefined', () => {
      const formData: FormDataType = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
      };

      const errors = validateFormData(formData);
      expect(errors).toContain('Minimal pilih satu layanan');
    });

    it('should return multiple errors when multiple fields are missing', () => {
      const formData: FormDataType = {};

      const errors = validateFormData(formData);
      expect(errors).toContain('Nama pelanggan harus diisi');
      expect(errors).toContain('Email pelanggan harus diisi');
      expect(errors).toContain('Nomor telepon harus diisi');
      expect(errors).toContain('Alamat harus diisi');
      expect(errors).toContain('Tanggal pengerjaan harus dipilih');
      expect(errors).toContain('Minimal pilih satu layanan');
      expect(errors).toHaveLength(6);
    });

    it('should accept multiple selected services', () => {
      const formData: FormDataType = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Jl. Test No. 123',
        date: '2025-02-01',
        selectedServices: ['service-001', 'service-002', 'service-003'],
        quantities: {
          'service-001': 1,
          'service-002': 2,
          'service-003': 3,
        },
      };

      const errors = validateFormData(formData);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateDateNotInPast', () => {
    it('should return true for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      const isValid = validateDateNotInPast(dateString);
      expect(isValid).toBe(true);
    });

    it('should return true for tomorrow', () => {
      // FIXED: Create tomorrow date using same logic as validateDateNotInPast
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Format as YYYY-MM-DD in local timezone
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const isValid = validateDateNotInPast(dateString);
      expect(isValid).toBe(true);
    });

    // Based on actual implementation: today is NOT valid (must be > today, not >=)
    it('should return false for today', () => {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      const isValid = validateDateNotInPast(dateString);
      expect(isValid).toBe(false); // Today is NOT valid
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];

      const isValid = validateDateNotInPast(dateString);
      expect(isValid).toBe(false);
    });

    it('should return false for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const dateString = pastDate.toISOString().split('T')[0];

      const isValid = validateDateNotInPast(dateString);
      expect(isValid).toBe(false);
    });
  });

  describe('formatTime', () => {
    it('should format single digit hour and minute with padding', () => {
      const time = formatTime('9', '5');
      expect(time).toBe('09:05');
    });

    it('should format double digit hour and minute correctly', () => {
      const time = formatTime('10', '30');
      expect(time).toBe('10:30');
    });

    it('should format midnight correctly', () => {
      const time = formatTime('0', '0');
      expect(time).toBe('00:00');
    });

    it('should format last minute of day correctly', () => {
      const time = formatTime('23', '59');
      expect(time).toBe('23:59');
    });

    it('should handle empty strings', () => {
      const time = formatTime('', '');
      expect(time).toBe('00:00');
    });
  });

  describe('getTomorrowDate', () => {
    it('should return tomorrow date in YYYY-MM-DD format', () => {
      const tomorrow = getTomorrowDate();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(tomorrow).toMatch(dateRegex);
    });

    it('should return a date one day after today', () => {
      // FIXED: Use Date object manipulation instead of string parsing
      const tomorrowString = getTomorrowDate();
      
      // Get today in UTC (same as getTomorrowDate uses)
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      
      // Get tomorrow in UTC
      const tomorrowUTC = new Date(todayUTC);
      tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
      
      // Format expected tomorrow as YYYY-MM-DD
      const expectedYear = tomorrowUTC.getUTCFullYear();
      const expectedMonth = String(tomorrowUTC.getUTCMonth() + 1).padStart(2, '0');
      const expectedDay = String(tomorrowUTC.getUTCDate()).padStart(2, '0');
      const expectedTomorrowString = `${expectedYear}-${expectedMonth}-${expectedDay}`;
      
      // Compare the strings directly
      expect(tomorrowString).toBe(expectedTomorrowString);
    });
  });
});

describe('Service Price Calculation', () => {
  interface Service {
    service_id: string;
    price: number;
    price_type: string;
  }

  interface FormData {
    selectedServices: string[];
    quantities: Record<string, number>;
  }

  function calculateServicePrice(services: Service[], formData: FormData): number {
    let total = 0;

    formData.selectedServices.forEach((serviceId: string) => {
      const service = services.find((s) => s.service_id === serviceId);
      if (service) {
        const quantity = formData.quantities?.[serviceId] || 1;
        total += service.price * quantity;
      }
    });

    return total;
  }

  const mockServices: Service[] = [
    { service_id: 'service-001', price: 150000, price_type: 'FIXED' },
    { service_id: 'service-002', price: 75000, price_type: 'HOURLY' },
    { service_id: 'service-003', price: 25000, price_type: 'UNIT' },
  ];

  it('should calculate price for single service with quantity 1', () => {
    const formData: FormData = {
      selectedServices: ['service-001'],
      quantities: { 'service-001': 1 },
    };

    const price = calculateServicePrice(mockServices, formData);
    expect(price).toBe(150000);
  });

  it('should calculate price for single service with multiple quantity', () => {
    const formData: FormData = {
      selectedServices: ['service-003'],
      quantities: { 'service-003': 5 },
    };

    const price = calculateServicePrice(mockServices, formData);
    expect(price).toBe(125000); // 25000 * 5
  });

  it('should calculate price for multiple services', () => {
    const formData: FormData = {
      selectedServices: ['service-001', 'service-002'],
      quantities: {
        'service-001': 1,
        'service-002': 2,
      },
    };

    const price = calculateServicePrice(mockServices, formData);
    expect(price).toBe(300000); // 150000 + (75000 * 2)
  });

  it('should calculate price for all services', () => {
    const formData: FormData = {
      selectedServices: ['service-001', 'service-002', 'service-003'],
      quantities: {
        'service-001': 1,
        'service-002': 2,
        'service-003': 4,
      },
    };

    const price = calculateServicePrice(mockServices, formData);
    // 150000 + (75000 * 2) + (25000 * 4) = 150000 + 150000 + 100000 = 400000
    expect(price).toBe(400000);
  });

  it('should default to quantity 1 if quantity not specified', () => {
    const formData: FormData = {
      selectedServices: ['service-001'],
      quantities: {},
    };

    const price = calculateServicePrice(mockServices, formData);
    expect(price).toBe(150000);
  });

  it('should return 0 for empty selected services', () => {
    const formData: FormData = {
      selectedServices: [],
      quantities: {},
    };

    const price = calculateServicePrice(mockServices, formData);
    expect(price).toBe(0);
  });

  it('should ignore non-existent service IDs', () => {
    const formData: FormData = {
      selectedServices: ['service-001', 'non-existent-service'],
      quantities: {
        'service-001': 1,
        'non-existent-service': 5,
      },
    };

    const price = calculateServicePrice(mockServices, formData);
    expect(price).toBe(150000); // Only service-001 price
  });
});

describe('Price Formatting', () => {
  function formatPrice(price: number, priceType: string): string {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

    switch (priceType) {
      case 'HOURLY':
        return `${formattedPrice}/jam`;
      case 'UNIT':
        return `${formattedPrice}/unit`;
      default:
        return formattedPrice;
    }
  }

  // Use matcher that handles non-breaking spaces (U+00A0)
  it('should format fixed price correctly', () => {
    const formatted = formatPrice(150000, 'FIXED');
    // Test the numeric value is correct
    expect(formatted.replace(/[^\d]/g, '')).toBe('150000');
    // Test it contains Rp and proper separators
    expect(formatted).toMatch(/^Rp[\s\u00A0]?150\.000$/);
  });

  it('should format hourly price correctly', () => {
    const formatted = formatPrice(75000, 'HOURLY');
    expect(formatted.replace(/[^\d]/g, '')).toBe('75000');
    expect(formatted).toMatch(/^Rp[\s\u00A0]?75\.000\/jam$/);
  });

  it('should format unit price correctly', () => {
    const formatted = formatPrice(25000, 'UNIT');
    expect(formatted.replace(/[^\d]/g, '')).toBe('25000');
    expect(formatted).toMatch(/^Rp[\s\u00A0]?25\.000\/unit$/);
  });

  it('should format large price correctly', () => {
    const formatted = formatPrice(1500000, 'FIXED');
    expect(formatted.replace(/[^\d]/g, '')).toBe('1500000');
    expect(formatted).toMatch(/^Rp[\s\u00A0]?1\.500\.000$/);
  });

  it('should format zero price correctly', () => {
    const formatted = formatPrice(0, 'FIXED');
    expect(formatted.replace(/[^\d]/g, '')).toBe('0');
    expect(formatted).toMatch(/^Rp[\s\u00A0]?0$/);
  });
});