/**
 * Named MySQL lock helper (GET_LOCK / RELEASE_LOCK).
 *
 * GET_LOCK is bound to the MySQL session, so the lock is taken and released on the
 * same dedicated QueryRunner. Never use a transaction manager or getManager() here:
 * those may run on a different pooled connection.
 *
 *  ISSUE         DATE           AUTHOR              DESCRIPTION
 *  EF-23         08-Oct-2026    Favio Figueroa      GET_LOCK instead of flag, skipped=200, axios timeout
 */
import { getConnection, QueryRunner } from 'typeorm';

export async function withDbLock<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ acquired: boolean; result?: T }> {
  const qr: QueryRunner = getConnection(process.env.DB_WRITE_CONNECTION_NAME).createQueryRunner();
  await qr.connect();
  let got = 0;
  try {
    // GET_LOCK names are server-wide; prefix with the schema so environments sharing a MySQL instance do not block each other
    const rows = await qr.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':', ?), 0) AS got", [name]);
    got = Number(rows?.[0]?.got ?? 0);
    if (got !== 1) return { acquired: false };
    const result = await fn();
    return { acquired: true, result };
  } finally {
    if (got === 1) {
      const rel = await qr
        .query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':', ?)) AS rel", [name])
        .catch(() => [{ rel: 0 }]);
      if (Number(rel?.[0]?.rel ?? 0) !== 1) {
        // Lock could not be released on this session: drop the physical connection
        // so MySQL frees the lock instead of returning it to the pool still held.
        const c: any = (qr as any).databaseConnection;
        if (c?.destroy) c.destroy();
      }
    }
    await qr.release().catch(() => {});
  }
}
