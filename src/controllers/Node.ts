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
import NodeModel from '../entity/Node';
import NodeConnectionModel from '../entity/NodeConnection';
import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get
} from '@pxp-nd/core';


@Model('flow-nd/Node')
class Node extends Controller {

  async getNodeData(node: any, dataId: any, manager: EntityManager) {
    const {action: {originName, originKey}} = node;
    const executeView = `select * from ${originName} where ${originKey} = ${dataId}`;
    const resExecuteView = await __(manager.query(executeView));
    return JSON.stringify(resExecuteView[0]);
  }

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async add(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    let node = new NodeModel();
    node.isInit = params.isInit;
    node.isEnd = params.isEnd;
    node.actionId = params.actionId;
    node.flowId = params.flowId;

    node = await manager.save(node);

    if (params.parents) {
      for (let parent of params.parents) {
        const nc = await NodeConnectionModel.find({ nodeIdMaster: parent.parentId });
        for (let connection of nc) {
          connection.nodeIdMaster = node.nodeId;
          await manager.save(connection);
        }
        let nodeConnection = new NodeConnectionModel();
        nodeConnection.nodeIdChild = node.nodeId;
        nodeConnection.nodeIdMaster = parent.parentId;
        nodeConnection.condition = parent.condition;
        nodeConnection = await manager.save(nodeConnection);
      }
    }

    return node;
  }

}

export default Node;
