import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
