// __tests__/mocks/prisma.ts
import { vi } from 'vitest';

export const mockPrisma = {
  vendor: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  service: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  booking: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  bookingItem: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  bookingHistory: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  userNotification: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock('@/app/components/lib/prisma', () => ({
  default: mockPrisma,
}));

export default mockPrisma;