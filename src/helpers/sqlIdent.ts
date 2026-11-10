/*****************************************************************************
 * Copyright(c) 2026 Qorus Inc
 * All rights reserved
 *****************************************************************************
 * NAME: sqlIdent.ts
 * DEVELOPER: Rensi Arteaga
 * DESCRIPTION: Parameterized origin queries. Identifiers are checked, values are bound.
 * REVISIONS:
 * Date Change      ID              Author              Description
 * -----------      -----------     --------------      ------------------------------------
 * 10-Nov-2026                      Rensi Arteaga       Created
 ******************************************************************************/

import { PxpError } from '@pxp-nd/core';

const SQL_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function sqlIdent(value: unknown): string {
  const ident = String(value ?? '');
  if (!SQL_IDENT.test(ident)) {
    throw new PxpError(400, 'Invalid origin');
  }
  return ident;
}

export function quoteIdent(value: unknown): string {
  return '`' + sqlIdent(value) + '`';
}

export async function selectByIdent(
  manager: { query: (sql: string, params?: unknown[]) => Promise<any> },
  originName: unknown,
  originKey: unknown,
  value: unknown,
): Promise<any[]> {
  const sql = `SELECT * FROM ${quoteIdent(originName)} WHERE ${quoteIdent(originKey)} = ?`;
  return manager.query(sql, [value]);
}
