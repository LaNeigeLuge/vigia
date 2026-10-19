import { describe, it, expect } from 'vitest';
import { PAGE_SIZE, selectAll } from './selectAll';

/** Fake table served page by page, recording each requested range. */
function fakeTable(total: number) {
  const calls: [number, number][] = [];
  const rows = Array.from({ length: total }, (_, i) => i);
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  };
  return { page, calls };
}

describe('selectAll', () => {
  // The bug this exists for: 1200 habit_logs, only 1000 ever loaded.
  it('returns every row past the first page', async () => {
    const { page, calls } = fakeTable(1200);
    const { data, error } = await selectAll(page);
    expect(error).toBeNull();
    expect(data).toHaveLength(1200);
    expect(data[1199]).toBe(1199);
    expect(calls).toEqual([[0, PAGE_SIZE - 1], [PAGE_SIZE, 2 * PAGE_SIZE - 1]]);
  });

  it('stops after one request when the table fits in a page', async () => {
    const { page, calls } = fakeTable(42);
    expect((await selectAll(page)).data).toHaveLength(42);
    expect(calls).toHaveLength(1);
  });

  // A full last page can't be told apart from "more to come" — one extra,
  // empty request is the price of not needing a count.
  it('handles a total that is an exact multiple of the page size', async () => {
    const { page, calls } = fakeTable(PAGE_SIZE);
    expect((await selectAll(page)).data).toHaveLength(PAGE_SIZE);
    expect(calls).toHaveLength(2);
  });

  it('returns the rows read so far and the error when a page fails', async () => {
    const err = { message: 'boom' };
    const { data, error } = await selectAll(async (from) =>
      from === 0
        ? { data: Array.from({ length: PAGE_SIZE }, () => 1), error: null }
        : { data: null, error: err });
    expect(error).toBe(err);
    expect(data).toHaveLength(PAGE_SIZE);
  });
});
