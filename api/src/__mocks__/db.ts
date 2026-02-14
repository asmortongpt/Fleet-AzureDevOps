import { vi } from 'vitest';

const defaultQueryResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };

export const pool = {
  query: vi.fn().mockResolvedValue(defaultQueryResult),
  connect: vi.fn().mockResolvedValue({
    query: vi.fn().mockResolvedValue(defaultQueryResult),
    release: vi.fn(),
  }),
  end: vi.fn(),
  on: vi.fn(),
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
};

export const db = {
  query: vi.fn().mockResolvedValue(defaultQueryResult),
};
