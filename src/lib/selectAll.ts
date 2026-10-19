/**
 * PostgREST caps every response at the project's `max_rows` (1000 on Supabase
 * by default) and truncates silently — no error, no flag. A single `select` on
 * a table that grows daily therefore loads fine for months, then starts
 * dropping rows: habit_logs crossed 1000 rows and past checkmarks "vanished"
 * on reload although they were in the database.
 *
 * Must match the server's max_rows: a page shorter than requested is how we
 * know we've reached the end, so a server cap below this would stop early.
 */
export const PAGE_SIZE = 1000;

interface PageResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/**
 * Fetch every row by walking `.range()` pages until a short page comes back.
 *
 * The query passed in must have a total `.order()` (down to a unique key),
 * otherwise Postgres may return rows in a different order on each page and
 * pagination would skip or duplicate them.
 *
 * Args:
 *   page: Builds the query for the inclusive row range [from, to].
 *
 * Returns:
 *   All rows, or the rows read so far plus the error that stopped the walk.
 */
export async function selectAll<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE_SIZE) return { data: rows, error: null };
  }
}
