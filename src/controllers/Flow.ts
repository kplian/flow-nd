/**
 * Copyright(c) 2021 Qorus Inc
 * * All rights reserved
 * * ******************************************************************************
 * * NAME: Flow.ts
 * * DEVELOPER: Jaime Figueroa
 * * DESCRIPTION: Flow Controller
 * * REVISIONS:
 * * Date             Change ID     Author Description
 * * -------------- ----------- -------------- ------------------------------------
 * 08-Jul-2021                  Jaime Rivera           Created
 * 18-Jul-2023    SP28JUL23     Mercedes Zambrana      Add deleteFlow, saveFlowName, duplicateFlow
 * ******************************************************************************
 */

import { EntityManager, getManager, In } from 'typeorm';

import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get
} from '@pxp-nd/core';
import NodeModel from '../entity/Node';
import NodeConnectionModel from '../entity/NodeConnection';
import FlowModel from '../entity/Flow';
import FlowInstanceModel from '../entity/FlowInstance';

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

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async deleteFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    let dataFlow = await __(FlowModel.findOne(params.flowId));


    if (dataFlow){
      dataFlow.isActive = 0 as number;
      dataFlow.enabled = 'N';
      const updFlow = await __(manager.save(dataFlow));

      if (updFlow){
        let flowInstance =  `UPDATE twf_flow_instance SET
            is_active = 'N' WHERE flow_id = ${updFlow.flowId}`;
        await manager.query(flowInstance);


        let flowNode = `UPDATE twf_node SET
            is_active = 'N' WHERE flow_id = ${updFlow.flowId}`;
        await manager.query(flowNode);


        const nodesToInact = await manager.find(NodeModel, { flowId: updFlow.flowId });
        const originalNodeIds = nodesToInact.map((node) => node.nodeId);

        const connectionsToInact = await manager.find(NodeConnectionModel, {
          where: { nodeIdChild: In(originalNodeIds) } // Suponiendo que originalNodeIds contiene los IDs de los nodos originales que deseas duplicar
        });

        const originalNodeCIds = connectionsToInact.map((node) => node.nodeConnectionId);


        let flowNodeC = `UPDATE twf_node_connection SET
            is_active = 'N' WHERE node_connection_id in ( ${originalNodeCIds})`;
        await manager.query(flowNodeC);

        return { success : true };
      }else{
        return { success : false };
      }

    }else{
      return { success : false };
    }

  }



  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async saveFlowName(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    let dataFlow = await __(FlowModel.findOne(params.flowId));
    if (dataFlow){
      dataFlow.name = params.name;
      const updFlow = await __(manager.save(dataFlow));

      return { success : true };
    }else{
      return { success : false };
    }

  }



  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async duplicateFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    const flowData = await manager.findOne(FlowModel, params.flowId);
    const flowToClone = {
      ...flowData,
      flowId: undefined as any,
      nodes: [] as any[],
      createdAt: undefined as any
    }

    const flowDataClone:any = await manager.save(FlowModel, {...flowToClone, name: `${flowData.name} Copy`});




    const nodesToDuplicate = await manager.find(NodeModel, { flowId: flowData?.flowId });
    const originalNodeIds = nodesToDuplicate.map((node) => node.nodeId);
    const duplicatedNodes = nodesToDuplicate.map((node) => {
      const duplicatedNode = manager.create(NodeModel, { ...node, nodeId:undefined as any });
      duplicatedNode.flowId =flowDataClone.flowId;
      return duplicatedNode;
    }); const savedNodes = await manager.save(duplicatedNodes);


    const newNodeIds = savedNodes.map((node) => node.nodeId);


    const connectionsToDuplicate = await manager.find(NodeConnectionModel, {
      where: { nodeIdChild: In(originalNodeIds) }
    });


    const duplicatedConnections = newNodeIds.map((nodeId, index) => {

      const duplicatedConnection = manager.create(NodeConnectionModel, {
        nodeConnectionId : undefined,
        nodeIdMaster: index === 0 ? null : newNodeIds[index - 1],
        nodeIdChild: nodeId,
      });
      return duplicatedConnection;
    });

    await manager.save(duplicatedConnections);



 return {success:true}
  }

}

export default Flow;
