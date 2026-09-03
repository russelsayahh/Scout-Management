import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * A JSON-file collection, seeded once and written atomically.
 *
 * This is the persistence seam for the whole app: users and scouts each own a
 * file through this helper, and swapping in a real database means replacing
 * this module rather than touching any domain code.
 *
 * Node-only.
 */

const DATA_DIR = path.join(process.cwd(), ".data");

export interface JsonStore<T> {
  /** Every item, seeding the file first if it does not exist yet. */
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
   * Brings a record written by an earlier version of the schema up to date.
   * Applied on every read, so both `all` and `mutate` see the current shape and
   * the file self-heals on the next write.
   */
  migrate?: (record: T) => T;
}

export function createJsonStore<T>(
  fileName: string,
  seed: () => Promise<T[]> | T[],
  options: JsonStoreOptions<T> = {},
): JsonStore<T> {
  const file = path.join(DATA_DIR, fileName);

  async function read(): Promise<T[]> {
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const records = parsed as T[];
      return options.migrate ? records.map(options.migrate) : records;
    } catch {
      // Missing or unreadable - treated as empty so seeding runs.
      return [];
    }
  }

  async function write(items: T[]): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Write-then-rename, so a crash mid-write cannot truncate the file.
    const temporary = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(items, null, 2), "utf8");
    await fs.rename(temporary, file);
  }

  /**
   * Read-modify-write on a single file is not atomic, so every writer queues
   * behind the last one.
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

  return {
    async all() {
      await ensureSeeded();
      return read();
    },

    async mutate(operation) {
      await ensureSeeded();
      return withLock(async () => {
        const items = await read();
        const result = await operation(items);
        await write(items);
        return result;
      });
    },
  };
}
