/**
 * @pxp-nd/flow — OpenAPI (@ApiDoc) payloads for flow-nd controllers (spec tempo-04).
 * Vendor is session-scoped; do not document vendorId / _vendorId as inputs.
 */

import { ApiDocSpec } from '@pxp-nd/core';

export const flowListTemplatesDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.listTemplates',
  summary: 'List templates',
  description:
    'Lists templates the session vendor can use: its own and the shared ones. Returns { data, count }. Defaults: _type \'template\', sort \'flowId\', dir \'ASC\', limit 50.',
  params: {
    type: 'object',
    properties: {
      _templateType: { type: 'string', enum: ['flow', 'funnel'] },
      _type: { type: 'string', enum: ['template'] },
      _publish: { type: 'string', enum: ['Y', 'N'], description: 'Y = only published templates.' },
      _isActive: { type: 'integer', enum: [0, 1] },
      genericFilterFields: { type: 'string', enum: ['name', 'description'] },
      genericFilterValue: { type: 'string' },
      filter: { type: 'string', description: 'JSON string { items, logicOperator }, as for the flow list.' },
      start: { type: 'integer', minimum: 0 },
      limit: { type: 'integer', minimum: 1 },
      sort: { type: 'string', enum: ['flowId', 'name', 'createdAt', 'modifiedAt'] },
      dir: { type: 'string', enum: ['ASC', 'DESC'] },
    },
    additionalProperties: false,
  },
  readOnly: true,
  permission: null,
};

export const flowGetDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.get',
  summary: 'Nodes of a flow',
  description:
    'Returns the nodes of one flow as an array of { node, connections }: connections are the IDs of child nodes, node.valuesForShowingInNode holds the main configured values.',
  params: {
    type: 'object',
    properties: { flowId: { type: 'integer', minimum: 1 } },
    required: ['flowId'],
    additionalProperties: false,
  },
  readOnly: true,
  permission: null,
};

export const flowGetFlowRenderDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.getFlowRender',
  summary: 'Editor board of a flow',
  description:
    'Returns { flow, board } as used by the flow editor. board.columns[\'2-column-nodes-configured\'].taskIds is the current node order (\'node-<nodeId>\'); board.columns[\'1-column-config-nodes\'].taskIds are the steps that can be added next. Same behaviour for GET and POST.',
  params: {
    type: 'object',
    properties: { flowId: { type: 'integer', minimum: 1 } },
    required: ['flowId'],
    additionalProperties: false,
  },
  readOnly: true,
  permission: null,
};

export const flowAddDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.add',
  summary: 'Create a flow',
  description:
    'Creates a flow for the session vendor. This is the default create route of the Flow model: it saves the fields it receives. Returns the saved flow row, including flowId.',
  params: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 255 },
      description: { type: 'string' },
      templateType: { type: 'string', enum: ['flow', 'funnel'] },
      type: { type: 'string', enum: ['custom', 'template'] },
      status: { type: 'string', enum: ['off', 'on'] },
    },
    required: ['name', 'templateType', 'type'],
    additionalProperties: false,
  },
  readOnly: false,
  permission: null,
};

export const flowSaveFlowDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.saveFlow',
  summary: 'Add or remove a step',
  description:
    'Adds or removes a step in a flow, as the flow editor does. The flow must be off, otherwise 400 \'Please turn off the flow before make a change\'. To add a step (origin \'cloneTask\'): taskIds is the full new order with \'new\' at the position of the new step, and tasks.new holds the flow ID and the action code. To remove a step (origin \'deleteTask\'): taskIds is the order without that node and deleteId is its ID. Other keys of tasks are ignored. Returns { success: true, nodeId } (the new node ID, or null).',
  params: {
    type: 'object',
    properties: {
      board: {
        type: 'object',
        properties: {
          origin: { type: 'string', enum: ['cloneTask', 'deleteTask'] },
          deleteId: { type: 'string', pattern: '^node-[0-9]+$', description: 'Only for deleteTask.' },
          columns: {
            type: 'object',
            properties: {
              '2-column-nodes-configured': {
                type: 'object',
                properties: {
                  taskIds: {
                    type: 'array',
                    items: { type: 'string', pattern: '^(new|node-[0-9]+)$' },
                    description: 'Node order. Existing nodes are \'node-<nodeId>\'; for cloneTask \'new\' once.',
                  },
                },
                required: ['taskIds'],
              },
            },
            required: ['2-column-nodes-configured'],
          },
          tasks: {
            type: 'object',
            properties: {
              new: {
                type: 'object',
                properties: {
                  flowId: { type: 'integer', minimum: 1 },
                  action: {
                    type: 'object',
                    properties: { code: { type: 'string', description: 'Action code from Action/getActions.' } },
                    required: ['code'],
                  },
                },
                required: ['flowId', 'action'],
              },
            },
          },
        },
        required: ['origin', 'columns'],
      },
    },
    required: ['board'],
    additionalProperties: false,
  },
  readOnly: false,
  permission: null,
};

export const flowSaveFlowNameDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.saveFlowName',
  summary: 'Rename a flow',
  description:
    'Renames a flow. The flow must be off (400 otherwise). For a template it also saves code, description, icon and flowType. Returns { success: true } or { success: false }.',
  params: {
    type: 'object',
    properties: {
      flowId: { type: 'integer', minimum: 1 },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      code: { type: 'string', description: 'Templates only.' },
      description: { type: 'string', description: 'Templates only.' },
      icon: { type: 'string', description: 'Templates only.' },
      flowType: { type: 'string', description: 'Templates only.' },
    },
    required: ['flowId', 'name'],
    additionalProperties: false,
  },
  readOnly: false,
  permission: null,
};

export const flowInsertEventFlowDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.insertEventFlow',
  summary: 'Add the trigger of a flow',
  description:
    'Creates the first node (isInit = \'Y\') of a flow from an EVENT action. Returns { success: true, nodeId } or { success: false, msg }.',
  params: {
    type: 'object',
    properties: {
      flowId: { type: 'integer', minimum: 1 },
      actionId: { type: 'integer', minimum: 1, description: 'An active EVENT action (Action/getActions with actionTypeName \'EVENT\').' },
    },
    required: ['flowId', 'actionId'],
    additionalProperties: false,
  },
  readOnly: false,
  permission: null,
};

export const flowChangeStatusFlowDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.changeStatusFlow',
  summary: 'Turn a flow on or off',
  description:
    'Toggles the flow status between \'off\' and \'on\'. A flow that is on runs for real contacts (sends emails and messages). Turning on needs at least 2 active steps (400 otherwise). Returns { success: true } or { success: false }.',
  params: {
    type: 'object',
    properties: { flowId: { type: 'integer', minimum: 1 } },
    required: ['flowId'],
    additionalProperties: false,
  },
  readOnly: false,
  permission: null,
};

export const flowDeleteFlowDoc: ApiDocSpec = {
  operationId: 'flow-nd.Flow.deleteFlow',
  summary: 'Delete a flow',
  description:
    'Soft-deletes a flow: the flow, its instances, nodes and connections become inactive. The flow must be off (400 otherwise). Returns { success: true } or { success: false }.',
  params: {
    type: 'object',
    properties: { flowId: { type: 'integer', minimum: 1 } },
    required: ['flowId'],
    additionalProperties: false,
  },
  readOnly: false,
  permission: null,
};

export const nodeAddDoc: ApiDocSpec = {
  operationId: 'flow-nd.Node.add',
  summary: 'Create a node with parent connections',
  description:
    'Creates a node in a flow. For each parent, the parent\'s existing child connections are moved to the new node and a connection parent → new node is added. Every parentId must be a node of the same flow. The flow editor uses Flow/saveFlow instead. Returns the saved node row, including nodeId.',
  params: {
    type: 'object',
    properties: {
      flowId: { type: 'integer', minimum: 1 },
      actionId: { type: 'integer', minimum: 1 },
      isInit: { type: 'string', enum: ['Y', 'N'] },
      isEnd: { type: 'string', enum: ['Y', 'N'] },
      parents: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            parentId: { type: 'integer', minimum: 1 },
            condition: { type: 'string' },
          },
          required: ['parentId'],
          additionalProperties: false,
        },
      },
    },
    required: ['flowId', 'actionId', 'isInit', 'isEnd'],
    additionalProperties: false,
  },
  readOnly: false,
  permission: null,
};

export const nodeAddActionConfigJsonDoc: ApiDocSpec = {
  operationId: 'flow-nd.Node.AddActionConfigJson',
  summary: 'Save the configuration of a step',
  description:
    'Saves the configuration of one node. The flow must be off (400 otherwise). The step fields are sent as top-level keys next to nodeId. __metadata maps a field name to { name } for fields that hold a merge variable; such a field is stored as \'{{ <name> }}\'. The step\'s validation controller runs before saving. Returns { actionConfigJson, success: true, nodeId, msg }.',
  params: {
    type: 'object',
    properties: {
      nodeId: { type: 'integer', minimum: 1 },
      __metadata: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
    },
    required: ['nodeId', '__metadata'],
    additionalProperties: true,
  },
  readOnly: false,
  permission: null,
};

export const nodeGetParameterizedNodeDoc: ApiDocSpec = {
  operationId: 'flow-nd.Node.getParameterizedNode',
  summary: 'Step with its field schema',
  description:
    'Returns a node with what is needed to configure it: the node, its merged current values, schemaJsonObject (the field schema of the step, with substitutions applied) and the merge fields available from the trigger of the flow. Does not change data.',
  params: {
    type: 'object',
    properties: {
      nodeId: { type: 'integer', minimum: 1 },
      substitutionsSchemaJson: {
        type: 'object',
        description: 'Values substituted into the step\'s schema template.',
        properties: {
          locationId: { type: 'integer', minimum: 1 },
          keyword: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
    required: ['nodeId'],
    additionalProperties: false,
  },
  readOnly: true,
  permission: null,
};

export const actionGetActionsDoc: ApiDocSpec = {
  operationId: 'flow-nd.Action.getActions',
  summary: 'Catalog of step types',
  description:
    'Returns { data: Action[] }; each action has actionId, code, name, schemaJson (field schema of the step), configJsonTemplate and actionType. Filter by actionTypeName, for example \'EVENT\' for triggers.',
  params: {
    type: 'object',
    properties: {
      actionTypeName: { type: 'string', description: 'For example EVENT, PAGE, CHAINED FLOW.' },
      actionId: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  },
  readOnly: true,
  permission: null,
};

export const actionGetFieldMapByActionDoc: ApiDocSpec = {
  operationId: 'flow-nd.Action.getFieldMapByAction',
  summary: 'Merge fields of an origin',
  description:
    'Returns the field-map rows (merge fields) of an origin, the data source of a trigger (Action.originName).',
  params: {
    type: 'object',
    properties: { originName: { type: 'string', minLength: 1 } },
    required: ['originName'],
    additionalProperties: false,
  },
  readOnly: true,
  permission: null,
};
