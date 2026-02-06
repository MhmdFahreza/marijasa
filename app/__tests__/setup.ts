// __tests__/setup.ts
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import React from 'react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    vendorId: 'test-vendor-123',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/jasa/detailjasa/test-vendor-123/form',
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock toast from sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef((props: any, ref: any) => 
      React.createElement('div', { ...props, ref })
    ),
    main: React.forwardRef((props: any, ref: any) => 
      React.createElement('main', { ...props, ref })
    ),
    button: React.forwardRef((props: any, ref: any) => 
      React.createElement('button', { ...props, ref })
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});