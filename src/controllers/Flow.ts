/**
 * Effex 2021
 *
 * MIT
 *
 * Flow Controller
 *
 * @summary Flow Controller
 * @author Jaime Figueroa
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
import FlowModel from '../entity/Flow';

@Model('flow-nd/Flow')
class Flow extends Controller {

  @Get()
  @DbSettings('Orm')
  @ReadOnly(true)
  @Log(true)
  async get(params: Record<string, any>): Promise<unknown> {
    const nodes = await NodeModel.find({ flowId: params.flowId });
    const restNodes = [];
    for (let node of nodes) {
      const {actionConfigJson, action: {actionType: { schemaJson }}} = node;
      const actionConfigJsonObject = actionConfigJson ? JSON.parse(actionConfigJson) : {};
      const schemaJsonObject = schemaJson ? JSON.parse(schemaJson) : {};
      const valuesForShowingInNode:any = {};
      Object.entries(schemaJsonObject).filter(([n, sjo]:[n: string, sjo: any]) => sjo.showInNode === true).forEach(([nameKey, json]: [nameKey: string, json: any]) => {
        valuesForShowingInNode[nameKey] = {
          label: json.label as string,
          value:actionConfigJsonObject[nameKey] || null
        }
      })
      const nodeRow = {
        ...node,
        valuesForShowingInNode
      }
      const connections = await NodeConnectionModel.find({ nodeIdMaster: node.nodeId});
      restNodes.push({ node: nodeRow, connections: connections.map(c => c.nodeIdChild) });
    }
    return restNodes;
  }

  async copyNodeConnections(nodeId: number, newNodeId: number, newFlowId: number, manager: EntityManager) {
    const connections = await __(NodeConnectionModel.find({ nodeIdMaster: nodeId }));

    for(let connection of connections) {
      const newNodeConnection = new NodeConnectionModel();
      const {nodeConnectionId, nodeIdMaster, nodeIdChild, createdAt, modifiedAt, ...nodeConnectionToCopy} = connection;

      // get node from nodeIdChild
      const dataNodeChild = await NodeModel.findOne({ nodeId: connection.nodeIdChild });

      const {nodeId: newNodeIdChild} = await this.copyNode(dataNodeChild, newFlowId, manager);
      Object.assign(newNodeConnection, {...nodeConnectionToCopy, nodeIdMaster: newNodeId, nodeIdChild:newNodeIdChild })
      const insertNewNodeConnection = await __(manager.save(NodeConnectionModel, newNodeConnection));

    }
  }
  async copyNode(node: Record<any, any>, newFlowId: number, manager: EntityManager) {

    // insert new node
    const newNode = new NodeModel();
    const { nodeId, flowId, createdAt, modifiedAt, actionConfigJson, ...nodeToCopy } = node;
    Object.assign(newNode, { ...nodeToCopy, flowId: newFlowId });
    const insertNewNode = await __(manager.save(NodeModel, newNode));
    // insert connection
    await this.copyNodeConnections(node.nodeId, insertNewNode.nodeId, newFlowId, manager);

    return {nodeId: insertNewNode.nodeId};

  }


  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async createFlowFromFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    // we need clone the flow selected
    const dataFlow = await __(FlowModel.findOne(params.flowId));
    const { flowId, createdAt, modifiedAt, nodes, ...flowToCopy} = dataFlow;
    const newFlow = new FlowModel();
    Object.assign(newFlow, flowToCopy);
    newFlow.name = params.name;
    newFlow.description = params.description;
    const insertNewFlow = await __(manager.save(FlowModel, newFlow));

    // create the nodes

    // get the first node "the trigger node"
    const dataNode = await NodeModel.findOne({ where: {flowId: params.flowId }, order: {nodeId: "ASC"}});

    dataNode && await this.copyNode(dataNode, insertNewFlow.flowId, manager);


    return { flowId : insertNewFlow.flowId };
  }
}

export default Flow;
