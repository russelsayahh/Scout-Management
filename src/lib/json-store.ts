import { supabase } from "@/lib/supabase";

/**
 * A Postgres-backed collection, seeded once on first read.
 *
 * This is the persistence seam for the whole app: every domain owns a table
 * through this helper, and the interface below - `all()` and `mutate()` - is
 * exactly what it was when this module wrote to local JSON files. That is
 * deliberate: every domain's `store.ts` only ever touches these two methods,
 * so moving the backend to Supabase never had to touch a single domain file.
 *
 * `mutate()` upserts every row left in the array afterwards and deletes any
 * row that was there before and is not any more - the same "the whole
 * collection gets rewritten" semantics the file version had, translated to
 * Postgres rather than expressed as a targeted `UPDATE`. At this app's scale
 * that costs nothing meaningful; a domain with a genuinely hot, narrow write
 * path can always move to a direct `.eq(...)` query later without this
 * module changing for anyone else.
 *
 * Node-only.
 */

export interface JsonStore<T> {
  /** Every item, seeding the table first if it is empty. */
  all(): Promise<T[]>;
  /**
   * Runs `operation` under a write lock. The operation receives the current
   * items and may mutate the array in place; whatever the array holds when it
   * returns is written back.
   */
  mutate<R>(operation: (items: T[]) => Promise<R> | R): Promise<R>;
}

export interface JsonStoreOptions<T> {
  /**
   * Brings a record written under an earlier schema up to date. Applied on
   * every read, so both `all` and `mutate` see the current shape and the
   * table self-heals on its next write. Kept from the file-store era for
   * parity - a fresh Supabase table starts in the current shape, so this is
   * ordinarily a no-op, but costs nothing to leave in place.
   */
  migrate?: (record: T) => T;
  /**
   * Whether an empty table gets `seed()` written into it automatically.
   * Defaults to true, which is right for structural data that must always
   * exist (the six troops, the bootstrap admin account) - a table nobody has
   * populated yet is exactly what "brand new project" looks like. Pass
   * `false` for anything that is really demonstration content: once someone
   * has deliberately cleared it out (see `scripts/reset-demo-data.sql`), an
   * empty table has to mean empty, not "reappear on the next cold start."
   */
  autoSeed?: boolean;
}

interface RecordWithId {
  id: string;
}

/** `"equipment-loans.json"` -> `"equipment_loans"`. */
function tableNameFor(fileName: string): string {
  return fileName.replace(/\.json$/, "").replace(/-/g, "_");
}

export function createJsonStore<T extends RecordWithId>(
  fileName: string,
  seed: () => Promise<T[]> | T[],
  options: JsonStoreOptions<T> = {},
): JsonStore<T> {
  const table = tableNameFor(fileName);

  async function read(): Promise<T[]> {
    const { data, error } = await supabase().from(table).select("*");
    if (error) throw new Error(`Reading "${table}" failed: ${error.message}`);

    const records = (data ?? []) as T[];
    return options.migrate ? records.map(options.migrate) : records;
  }

  async function write(items: T[]): Promise<void> {
    if (items.length > 0) {
      const { error } = await supabase().from(table).upsert(items, { onConflict: "id" });
      if (error) throw new Error(`Writing "${table}" failed: ${error.message}`);
    }
  }

  /**
   * Removes rows that were present in `before` but are gone from `after`, so
   * a `mutate` that drops an item from the array (there is no such call site
   * today, but the contract allows it) is not left stranded in Postgres.
   */
  async function reconcile(before: T[], after: T[]): Promise<void> {
    const afterIds = new Set(after.map((item) => item.id));
    const removed = before.map((item) => item.id).filter((id) => !afterIds.has(id));

    await write(after);
    if (removed.length > 0) {
      const { error } = await supabase().from(table).delete().in("id", removed);
      if (error) throw new Error(`Removing rows from "${table}" failed: ${error.message}`);
    }
  }

  /**
   * Requests against one table are not atomic across each other, so every
   * writer queues behind the last one - the same reason this queue existed
   * for the file store.
   */
  let queue: Promise<unknown> = Promise.resolve();

  function withLock<R>(operation: () => Promise<R>): Promise<R> {
    const run = queue.then(operation, operation);
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  let seeded: Promise<void> | null = null;

  function ensureSeeded(): Promise<void> {
    seeded ??= withLock(async () => {
      const existing = await read();
      if (existing.length > 0) return;
      await write(await seed());
    });
    return seeded;
  }

  const autoSeed = options.autoSeed ?? true;

  return {
    async all() {
      if (autoSeed) await ensureSeeded();
      return read();
    },

    async mutate(operation) {
      if (autoSeed) await ensureSeeded();
      return withLock(async () => {
        const before = await read();
        const items = [...before];
        const result = await operation(items);
        await reconcile(before, items);
        return result;
      });
    },
  };
}
