/**
 * Effex 2021
 *
 * MIT
 *
 * Member Controller
 *
 * @summary Member Controller
 * @author Favio Figueroa
 *
 * Created at     : 2021-07-08 12:55:38
 * Last modified  :
 */

import { EntityManager, getManager } from 'typeorm';

import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get
} from '@pxp-nd/core';
import NodeModel from '../entity/Node';
import NodeConnectionModel from '../entity/NodeConnection';

@Model('flow-nd/Flow')
class Flow extends Controller {

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async get(params: Record<string, any>): Promise<unknown> {
    const nodes = await NodeModel.find({ flowId: params.flowId });
    const restNodes = [];
    for (let node of nodes) {
      const connections = await NodeConnectionModel.find({ nodeIdMaster: node.nodeId});
      restNodes.push({ node, connections: connections.map(c => c.nodeIdChild) });
    }
    return restNodes;
  }
}

export default Flow;
