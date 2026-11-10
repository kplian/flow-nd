/*****************************************************************************
 * Copyright(c) 2026 Qorus Inc
 * All rights reserved
 *****************************************************************************
 * NAME: flowFilter.ts
 * DEVELOPER: Rensi Arteaga
 * DESCRIPTION: Whitelist of flow list filter columns. Client field names are not interpolated.
 * REVISIONS:
 * Date Change      ID              Author              Description
 * -----------      -----------     --------------      ------------------------------------
 * 10-Nov-2026                      Rensi Arteaga       Created
 ******************************************************************************/

import { PxpError } from '@pxp-nd/core';

const FLOW_FILTER_COLUMNS: Record<string, string> = {
  flowId: 'flow_id',
  flow_id: 'flow_id',
  vendorId: 'vendor_id',
  vendor_id: 'vendor_id',
  code: 'code',
  name: 'name',
  enabled: 'enabled',
  type: 'type',
  createdBy: 'created_by',
  created_by: 'created_by',
  modifiedBy: 'modified_by',
  modified_by: 'modified_by',
  createdAt: 'created_at',
  created_at: 'created_at',
  modifiedAt: 'modified_at',
  modified_at: 'modified_at',
  isActive: 'is_active',
  is_active: 'is_active',
  description: 'description',
  icon: 'icon',
  status: 'status',
  templateType: 'template_type',
  template_type: 'template_type',
  flowType: 'flow_type',
  flow_type: 'flow_type',
  publish: 'publish',
  userIdAi: 'user_id_ai',
  user_id_ai: 'user_id_ai',
  userAi: 'user_ai',
  user_ai: 'user_ai',
};

export function flowFilterColumn(field: unknown): string {
  const column = FLOW_FILTER_COLUMNS[String(field ?? '')];
  if (!column) {
    throw new PxpError(400, 'Invalid filter field');
  }
  return column;
}
