import 'reflect-metadata';
import { getManager } from 'typeorm';
import { PxpError } from '@pxp-nd/core';
import NodeModel from '../src/entity/Node';
import NodeInstanceModel from '../src/entity/NodeInstance';
import Event from '../src/entity/Event';
import Flow from '../src/entity/Flow';
import NodeController from '../src/controllers/Node';
import FlowInstanceController from '../src/controllers/FlowInstance';
import NodeInstanceController from '../src/controllers/NodeInstance';
import { flowFilterColumn } from '../src/helpers/flowFilter';

jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getManager: jest.fn(),
  };
});

const pxpConfig = { apiPrefix: '/api', defaultDbSettings: 'Orm' as const, middlewares: [] as any[] };

function queryManager() {
  const query = jest.fn().mockResolvedValue([{ id: 1 }]);
  const save = jest.fn().mockResolvedValue({});
  (getManager as unknown as jest.Mock).mockReturnValue({ query, save });
  return { query, save };
}

describe('select by identifier', () => {
  it('binds a stored value and rejects a bad origin before querying', async () => {
    const ctrl = new NodeController('flow-nd', NodeModel, pxpConfig);
    const query = jest.fn();
    await expect(
      ctrl.getNodeData({ action: { originName: 'bad name', originKey: 'id' } }, 1, { query } as any)
    ).rejects.toBeInstanceOf(PxpError);
    expect(query).not.toHaveBeenCalled();

    const ok = jest.fn().mockResolvedValue([{ id: 7 }]);
    const raw = await ctrl.getNodeData(
      { action: { originName: 'people', originKey: 'person_id' } },
      '1 UNION SELECT 1',
      { query: ok } as any,
    );
    expect(ok).toHaveBeenCalledWith(
      'SELECT * FROM `people` WHERE `person_id` = ?',
      ['1 UNION SELECT 1'],
    );
    expect(raw).toBe(JSON.stringify({ id: 7 }));
  });

  it('executeActionJson uses the action row, not the request identifiers', async () => {
    const { query } = queryManager();
    const ctrl = new NodeController('flow-nd', NodeModel, pxpConfig);
    jest.spyOn(NodeModel, 'findOne').mockResolvedValue({
      action: { originName: 'people', originKey: 'person_id' },
    } as any);
    jest.spyOn(ctrl, 'getParameterizedNode').mockResolvedValue({
      mergeValues: { payload: '1 UNION SELECT 1' },
    } as any);

    await ctrl.executeActionJson(
      { nodeId: 4, fromValues: 'payload', originName: 'other_table', originKey: 'other_col' },
      {} as any,
    );

    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM `people` WHERE `person_id` = ?',
      ['1 UNION SELECT 1'],
    );
    expect(query.mock.calls[0][0]).not.toContain('UNION');
  });

  it('executeActionJson rejects an action origin that is not an identifier', async () => {
    const { query } = queryManager();
    const ctrl = new NodeController('flow-nd', NodeModel, pxpConfig);
    jest.spyOn(NodeModel, 'findOne').mockResolvedValue({
      action: { originName: 'people;drop', originKey: 'id' },
    } as any);
    jest.spyOn(ctrl, 'getParameterizedNode').mockResolvedValue({ mergeValues: { payload: '1' } } as any);

    await expect(
      ctrl.executeActionJson({ nodeId: 4, fromValues: 'payload' }, {} as any)
    ).rejects.toBeInstanceOf(PxpError);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('event and node instance queries', () => {
  it('eventProcesss binds dataId', async () => {
    const { query } = queryManager();
    jest.spyOn(Event, 'find').mockResolvedValue([
      { eventId: 1, actionId: 2, dataId: '1 UNION SELECT 1', status: 'pending' },
    ] as any);
    jest.spyOn(NodeModel, 'find').mockResolvedValue([
      { flowId: 9, action: { originName: 'people', originKey: 'person_id' } },
    ] as any);
    jest.spyOn(Flow, 'findOne').mockResolvedValue(null as any);
    const ctrl = new FlowInstanceController('flow-nd', null, pxpConfig);
    await ctrl.eventProcesss({} as any);
    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM `people` WHERE `person_id` = ?',
      ['1 UNION SELECT 1'],
    );
  });

  it('RecursiveInstance binds dataId and uses the action identifiers', async () => {
    const { query } = queryManager();
    const ctrl = new NodeInstanceController('flow-nd', NodeInstanceModel, pxpConfig);
    await ctrl.RecursiveInstance({
      node: {
        nodeId: 3,
        actionConfigJson: '',
        action: {
          originName: 'people',
          originKey: 'person_id',
          configJsonTemplate: '',
          actionType: { isDelay: 'N', controller: '' },
        },
      },
      flowInstance: {
        flowInstanceId: 8,
        originName: 'evil',
        originKey: 'evil',
        dataId: '1 UNION SELECT 1',
      },
    }, { save: jest.fn() } as any);
    expect(query.mock.calls[0][0]).toBe('SELECT * FROM `people` WHERE `person_id` = ?');
    expect(query.mock.calls[0][1]).toEqual(['1 UNION SELECT 1']);
    expect(query.mock.calls[0][0]).not.toContain('evil');
  });
});

describe('getParameterizedNode vendor', () => {
  it('fills the template with the session vendor', async () => {
    const ctrl = new NodeController('flow-nd', NodeModel, pxpConfig);
    ctrl.user = { harmony: { vendor_id: 7 } };
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(NodeModel, 'findOne')
      .mockResolvedValueOnce({
        flowId: 1,
        actionConfigJson: null,
        action: {
          schemaJson: '{"v":{{vendorId}}}',
          configJsonTemplate: null,
          actionType: { schemaJson: null },
        },
      } as any)
      .mockResolvedValueOnce({ action: { originName: 'people' } } as any);
    const result: any = await ctrl.getParameterizedNode(
      { nodeId: 1, substitutionsSchemaJson: { vendorId: 99 } },
      { createQueryBuilder: () => qb } as any,
    );
    expect(result.schemaJsonObject.v).toBe(7);
  });
});

describe('flowFilterColumn', () => {
  it('maps a known field and rejects anything else', () => {
    expect(flowFilterColumn('name')).toBe('name');
    expect(flowFilterColumn('createdAt')).toBe('created_at');
    expect(() => flowFilterColumn('name; drop table twf_flow')).toThrow(PxpError);
  });
});
