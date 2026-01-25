// __tests__/unit/paymentFees.test.ts
import { describe, it, expect } from 'vitest';

// ==========================================
// XENDIT PAYMENT FEES (Re-implemented for testing)
// ==========================================

const XENDIT_PAYMENT_FEES: Record<string, {
  type: 'fixed' | 'percentage' | 'combined';
  rate?: number;
  min?: number;
  amount?: number;
  fixed?: number;
  name: string;
  category: string;
  icon: string;
  color: string;
}> = {
  // E-Wallets - 1.5% (min Rp 1,500)
  ewallet_dana: { type: 'percentage', rate: 1.5, min: 1500, name: 'DANA', category: 'ewallet', icon: 'wallet', color: '#10B981' },
  ewallet_ovo: { type: 'percentage', rate: 1.5, min: 1500, name: 'OVO', category: 'ewallet', icon: 'wallet', color: '#4F46E5' },
  ewallet_shopeepay: { type: 'percentage', rate: 1.5, min: 1500, name: 'ShopeePay', category: 'ewallet', icon: 'wallet', color: '#EE4D2D' },
  ewallet_linkaja: { type: 'percentage', rate: 1.5, min: 1500, name: 'LinkAja', category: 'ewallet', icon: 'wallet', color: '#E31E24' },

  // Virtual Account - Flat fee
  va_bca: { type: 'fixed', amount: 4500, name: 'BCA Virtual Account', category: 'va', icon: 'building', color: '#1E3A8A' },
  va_bni: { type: 'fixed', amount: 4000, name: 'BNI Virtual Account', category: 'va', icon: 'building', color: '#F59E0B' },
  va_bri: { type: 'fixed', amount: 4000, name: 'BRI Virtual Account', category: 'va', icon: 'building', color: '#DC2626' },
  va_mandiri: { type: 'fixed', amount: 4000, name: 'Mandiri Virtual Account', category: 'va', icon: 'building', color: '#059669' },
  va_permata: { type: 'fixed', amount: 4000, name: 'Permata Virtual Account', category: 'va', icon: 'building', color: '#7C3AED' },
  va_bsi: { type: 'fixed', amount: 4000, name: 'BSI Virtual Account', category: 'va', icon: 'building', color: '#059669' },
  va_cimb: { type: 'fixed', amount: 4000, name: 'CIMB Niaga Virtual Account', category: 'va', icon: 'building', color: '#DC2626' },

  // QRIS - 0.7%
  qris: { type: 'percentage', rate: 0.7, min: 0, name: 'QRIS', category: 'qris', icon: 'qrcode', color: '#EF4444' },

  // Cards - 2.9% + Rp 2,000
  card_visa: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Kartu Visa', category: 'card', icon: 'credit-card', color: '#1A1F71' },
  card_mastercard: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Kartu Mastercard', category: 'card', icon: 'credit-card', color: '#EB001B' },
  card_jcb: { type: 'combined', rate: 2.9, fixed: 2000, name: 'Kartu JCB', category: 'card', icon: 'credit-card', color: '#0066B3' },

  // Retail Outlets - Flat fee
  retail_alfamart: { type: 'fixed', amount: 5000, name: 'Alfamart', category: 'retail', icon: 'store', color: '#DC2626' },
  retail_indomaret: { type: 'fixed', amount: 5000, name: 'Indomaret', category: 'retail', icon: 'store', color: '#1E40AF' },

  // Tunai - No fee
  tunai: { type: 'fixed', amount: 0, name: 'Tunai', category: 'tunai', icon: 'banknote', color: '#6B7280' },
};

const SERVICE_FEE = 10000;

// Calculate fee based on payment method
function calculateTransactionFee(paymentMethod: string, amount: number): number {
  const config = XENDIT_PAYMENT_FEES[paymentMethod];
  if (!config) return 0;

  switch (config.type) {
    case 'fixed':
      return config.amount || 0;
    case 'percentage':
      const percentFee = Math.ceil(amount * ((config.rate || 0) / 100));
      return Math.max(percentFee, config.min || 0);
    case 'combined':
      return Math.ceil(amount * ((config.rate || 0) / 100)) + (config.fixed || 0);
    default:
      return 0;
  }
}

// Get display fee description
function getFeeDescription(paymentMethod: string): string {
  const config = XENDIT_PAYMENT_FEES[paymentMethod];
  if (!config) return '-';

  switch (config.type) {
    case 'fixed':
      if (config.amount === 0) return 'Gratis';
      return `Rp ${(config.amount || 0).toLocaleString('id-ID')}`;
    case 'percentage':
      return (config.min || 0) > 0
        ? `${config.rate}% (min Rp ${(config.min || 0).toLocaleString('id-ID')})`
        : `${config.rate}%`;
    case 'combined':
      return `${config.rate}% + Rp ${(config.fixed || 0).toLocaleString('id-ID')}`;
    default:
      return '-';
  }
}

// Get calculated fee display
function getCalculatedFeeDisplay(paymentMethod: string, amount: number): string {
  const fee = calculateTransactionFee(paymentMethod, amount);
  if (fee === 0) return 'Gratis';
  return `Rp ${fee.toLocaleString('id-ID')}`;
}

// ==========================================
// TESTS
// ==========================================

describe('Payment Fee Calculations', () => {
  describe('calculateTransactionFee', () => {
    describe('Fixed Fee Payment Methods', () => {
      it('should calculate correct fee for BCA Virtual Account', () => {
        const fee = calculateTransactionFee('va_bca', 100000);
        expect(fee).toBe(4500);
      });

      it('should calculate correct fee for BNI Virtual Account', () => {
        const fee = calculateTransactionFee('va_bni', 100000);
        expect(fee).toBe(4000);
      });

      it('should calculate correct fee for BRI Virtual Account', () => {
        const fee = calculateTransactionFee('va_bri', 500000);
        expect(fee).toBe(4000);
      });

      it('should calculate correct fee for Mandiri Virtual Account', () => {
        const fee = calculateTransactionFee('va_mandiri', 1000000);
        expect(fee).toBe(4000);
      });

      it('should calculate zero fee for Tunai (cash)', () => {
        const fee = calculateTransactionFee('tunai', 500000);
        expect(fee).toBe(0);
      });

      it('should calculate correct fee for Alfamart', () => {
        const fee = calculateTransactionFee('retail_alfamart', 100000);
        expect(fee).toBe(5000);
      });

      it('should calculate correct fee for Indomaret', () => {
        const fee = calculateTransactionFee('retail_indomaret', 200000);
        expect(fee).toBe(5000);
      });
    });

    describe('Percentage Fee Payment Methods', () => {
      it('should calculate correct fee for DANA (1.5%)', () => {
        const fee = calculateTransactionFee('ewallet_dana', 100000);
        // 1.5% of 100000 = 1500
        expect(fee).toBe(1500);
      });

      it('should apply minimum fee for DANA when percentage is less than minimum', () => {
        const fee = calculateTransactionFee('ewallet_dana', 50000);
        // 1.5% of 50000 = 750, but minimum is 1500
        expect(fee).toBe(1500);
      });

      it('should calculate correct fee for OVO (1.5%)', () => {
        const fee = calculateTransactionFee('ewallet_ovo', 200000);
        // 1.5% of 200000 = 3000
        expect(fee).toBe(3000);
      });

      it('should calculate correct fee for ShopeePay (1.5%)', () => {
        const fee = calculateTransactionFee('ewallet_shopeepay', 500000);
        // 1.5% of 500000 = 7500
        expect(fee).toBe(7500);
      });

      it('should calculate correct fee for QRIS (0.7%)', () => {
        const fee = calculateTransactionFee('qris', 100000);
        // 0.7% of 100000 = 700
        expect(fee).toBe(700);
      });

      it('should calculate correct fee for QRIS with large amount', () => {
        const fee = calculateTransactionFee('qris', 1000000);
        // 0.7% of 1000000 = 7000
        expect(fee).toBe(7000);
      });

      it('should ceiling the percentage calculation', () => {
        const fee = calculateTransactionFee('qris', 123456);
        // 0.7% of 123456 = 864.192, ceil to 865
        expect(fee).toBe(865);
      });
    });

    describe('Combined Fee Payment Methods', () => {
      it('should calculate correct fee for Visa Card (2.9% + Rp 2,000)', () => {
        const fee = calculateTransactionFee('card_visa', 100000);
        // 2.9% of 100000 = 2900, + 2000 = 4900
        expect(fee).toBe(4900);
      });

      it('should calculate correct fee for Mastercard (2.9% + Rp 2,000)', () => {
        const fee = calculateTransactionFee('card_mastercard', 500000);
        // 2.9% of 500000 = 14500, + 2000 = 16500
        expect(fee).toBe(16500);
      });

      it('should calculate correct fee for JCB Card (2.9% + Rp 2,000)', () => {
        const fee = calculateTransactionFee('card_jcb', 1000000);
        // 2.9% of 1000000 = 29000, + 2000 = 31000
        expect(fee).toBe(31000);
      });

      it('should ceiling the combined percentage calculation', () => {
        const fee = calculateTransactionFee('card_visa', 123456);
        // 2.9% of 123456 = 3580.224, ceil to 3581, + 2000 = 5581
        expect(fee).toBe(5581);
      });
    });

    describe('Unknown Payment Methods', () => {
      it('should return 0 for unknown payment method', () => {
        const fee = calculateTransactionFee('unknown_method', 100000);
        expect(fee).toBe(0);
      });

      it('should return 0 for empty payment method', () => {
        const fee = calculateTransactionFee('', 100000);
        expect(fee).toBe(0);
      });
    });
  });

  describe('getFeeDescription', () => {
    it('should return correct description for fixed fee', () => {
      const desc = getFeeDescription('va_bca');
      expect(desc).toBe('Rp 4.500');
    });

    it('should return "Gratis" for zero fee', () => {
      const desc = getFeeDescription('tunai');
      expect(desc).toBe('Gratis');
    });

    it('should return correct description for percentage with minimum', () => {
      const desc = getFeeDescription('ewallet_dana');
      expect(desc).toBe('1.5% (min Rp 1.500)');
    });

    it('should return correct description for percentage without minimum', () => {
      const desc = getFeeDescription('qris');
      expect(desc).toBe('0.7%');
    });

    it('should return correct description for combined fee', () => {
      const desc = getFeeDescription('card_visa');
      expect(desc).toBe('2.9% + Rp 2.000');
    });

    it('should return "-" for unknown payment method', () => {
      const desc = getFeeDescription('unknown');
      expect(desc).toBe('-');
    });
  });

  describe('getCalculatedFeeDisplay', () => {
    it('should return formatted fee display', () => {
      const display = getCalculatedFeeDisplay('va_bca', 100000);
      expect(display).toBe('Rp 4.500');
    });

    it('should return "Gratis" for zero fee', () => {
      const display = getCalculatedFeeDisplay('tunai', 100000);
      expect(display).toBe('Gratis');
    });

    it('should return formatted fee for percentage method', () => {
      const display = getCalculatedFeeDisplay('qris', 100000);
      expect(display).toBe('Rp 700');
    });

    it('should return formatted fee for combined method', () => {
      const display = getCalculatedFeeDisplay('card_visa', 100000);
      expect(display).toBe('Rp 4.900');
    });
  });

  describe('SERVICE_FEE constant', () => {
    it('should be 10000', () => {
      expect(SERVICE_FEE).toBe(10000);
    });
  });

  describe('Total Price Calculation', () => {
    it('should calculate total price with service fee and transaction fee', () => {
      const servicePrice = 300000;
      const serviceFee = SERVICE_FEE;
      const baseAmount = servicePrice + serviceFee;
      const transactionFee = calculateTransactionFee('va_bca', baseAmount);
      const totalPrice = baseAmount + transactionFee;

      expect(baseAmount).toBe(310000);
      expect(transactionFee).toBe(4500);
      expect(totalPrice).toBe(314500);
    });

    it('should calculate total price with tunai (no transaction fee)', () => {
      const servicePrice = 300000;
      const serviceFee = SERVICE_FEE;
      const baseAmount = servicePrice + serviceFee;
      const transactionFee = calculateTransactionFee('tunai', baseAmount);
      const totalPrice = baseAmount + transactionFee;

      expect(baseAmount).toBe(310000);
      expect(transactionFee).toBe(0);
      expect(totalPrice).toBe(310000);
    });

    it('should calculate total price with e-wallet', () => {
      const servicePrice = 500000;
      const serviceFee = SERVICE_FEE;
      const baseAmount = servicePrice + serviceFee;
      const transactionFee = calculateTransactionFee('ewallet_ovo', baseAmount);
      const totalPrice = baseAmount + transactionFee;

      // baseAmount = 510000
      // 1.5% of 510000 = 7650
      expect(baseAmount).toBe(510000);
      expect(transactionFee).toBe(7650);
      expect(totalPrice).toBe(517650);
    });
  });
});

describe('XENDIT_PAYMENT_FEES Configuration', () => {
  it('should have all e-wallet payment methods', () => {
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('ewallet_dana');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('ewallet_ovo');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('ewallet_shopeepay');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('ewallet_linkaja');
  });

  it('should have all virtual account payment methods', () => {
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('va_bca');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('va_bni');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('va_bri');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('va_mandiri');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('va_permata');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('va_bsi');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('va_cimb');
  });

  it('should have all card payment methods', () => {
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('card_visa');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('card_mastercard');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('card_jcb');
  });

  it('should have QRIS payment method', () => {
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('qris');
    expect(XENDIT_PAYMENT_FEES.qris.type).toBe('percentage');
    expect(XENDIT_PAYMENT_FEES.qris.rate).toBe(0.7);
  });

  it('should have retail payment methods', () => {
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('retail_alfamart');
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('retail_indomaret');
  });

  it('should have tunai (cash) payment method', () => {
    expect(XENDIT_PAYMENT_FEES).toHaveProperty('tunai');
    expect(XENDIT_PAYMENT_FEES.tunai.amount).toBe(0);
  });

  it('should have correct category for each payment method', () => {
    expect(XENDIT_PAYMENT_FEES.ewallet_dana.category).toBe('ewallet');
    expect(XENDIT_PAYMENT_FEES.va_bca.category).toBe('va');
    expect(XENDIT_PAYMENT_FEES.qris.category).toBe('qris');
    expect(XENDIT_PAYMENT_FEES.card_visa.category).toBe('card');
    expect(XENDIT_PAYMENT_FEES.retail_alfamart.category).toBe('retail');
    expect(XENDIT_PAYMENT_FEES.tunai.category).toBe('tunai');
  });
});