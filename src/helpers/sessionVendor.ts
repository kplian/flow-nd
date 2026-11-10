/*****************************************************************************
 * Copyright(c) 2026 Qorus Inc
 * All rights reserved
 *****************************************************************************
 * NAME: sessionVendor.ts
 * DEVELOPER: Rensi Arteaga
 * DESCRIPTION: Session vendor for flow templates. Request vendor is ignored for harmony users.
 * REVISIONS:
 * Date Change      ID              Author              Description
 * -----------      -----------     --------------      ------------------------------------
 * 10-Nov-2026                      Rensi Arteaga       Created
 ******************************************************************************/

export function harmonyVendorId(user: any): number | null {
  const raw = user?.harmony?.vendor_id;
  if (raw == null || raw === '') {
    return null;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}
