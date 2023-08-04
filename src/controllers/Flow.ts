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
 * 02-Aug-2023    SP11AUG23     Mercedes Zambrana      Add validations in deleteFlow and saveFlow
 * ******************************************************************************
 */

import { EntityManager, getManager, In } from 'typeorm';

import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get
} from '@pxp-nd/core';
import NodeModel from '../entity/Node';
import ActionModel from '../entity/Action';
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

        const nodesToInact = await manager.find(NodeModel, { flowId: updFlow.flowId , isActive:true});

        if (nodesToInact.length > 0){

        let flowNode = `UPDATE twf_node SET
            is_active = 'N' WHERE flow_id = ${updFlow.flowId}`;
        await manager.query(flowNode);


        const nodesToInact = await manager.find(NodeModel, { flowId: updFlow.flowId });
        const originalNodeIds = nodesToInact.map((node) => node.nodeId);

        const connectionsToInact = await manager.find(NodeConnectionModel, {
          where: { nodeIdChild: In(originalNodeIds) } // Suponiendo que originalNodeIds contiene los IDs de los nodos originales que deseas duplicar
        });

        const originalNodeCIds = connectionsToInact.map((node) => node.nodeConnectionId);

          if (originalNodeCIds.length > 0){
        let flowNodeC = `UPDATE twf_node_connection SET
            is_active = 'N' WHERE node_connection_id in ( ${originalNodeCIds})`;
        await manager.query(flowNodeC);
          }

        }

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

    if (flowData){
      const flowToClone = {
        ...flowData,
        flowId: undefined as any,
        nodes: [] as any[],
        createdAt: undefined as any
      }

      const flowDataClone:any = await manager.save(FlowModel, {...flowToClone, name: `${flowData.name} Copy`});




      const nodesToDuplicate = await manager.find(NodeModel, { flowId: flowData?.flowId ,isActive:true});

      if (nodesToDuplicate){
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

      }
      return {success:true}
    }else{
      return {success:false, "respuesta": "No Flow"}
    }





  }






  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async saveFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
console.log (params);
    let nodeRefIds = params.board.columns['2-column-nodes-configured'].taskIds;
    console.log ("nodesRef:",nodeRefIds);
     let nodes = params.board.tasks?params.board.tasks:[];
     console.log ("nod:", nodes);

     let masterId = null;
     let id = null;
     let flowId = null;


     let taskIds:any = [];
     if (nodeRefIds.length === 0) {
       flowId= params.board.columns['2-column-nodes-configured'].flowId;
     }else{
       for (const nodeId of nodeRefIds) {
         // console.log ('node:',nodes[`${nodeId}`]);
           if (nodeId != 'new') {
             id = parseInt(nodeId.split("-")[1]);
             taskIds.push(id);

             const connectionsToDel = await manager.find(NodeConnectionModel, {
               where: {nodeIdChild: id}
             });


             if (connectionsToDel) {
               //console.log("hay para eliminar---->", connectionsToDel);
               const originalNodeCIds = connectionsToDel.map((node: any) => node.nodeConnectionId);
               //console.log("eliminando: ", originalNodeCIds);

               let flowNodeC = await getManager().query(`DELETE
                                                       from twf_node_connection
                                                       WHERE node_connection_id = ${originalNodeCIds}`);

             }
           }

         //}
       }
     }
 //if (nodes[`${nodeId}`]) {
           //flowId = nodes[`${nodeId}`].flowId;
     if (params.board.origin =='deleteTask') { console.log("aqui elimina", params.board.deleteID);
        let nodeDelId = parseInt(params.board.deleteId.split("-")[1]);

        console.log (nodeDelId);

        if (nodeDelId){
          //If there are some nodes in node_connections after delete all records sent, to inactive node
          let connectNoDel = await getManager().query(`SELECT n.node_id
                                                    from twf_node_connection nd
                                                           inner join twf_node n on n.node_id = nd.node_id_child
                                                    WHERE n.node_id = ${nodeDelId}`);

          const currentNodesIds = connectNoDel.map((record: { node_id: number }) => record.node_id);

          // Get nodes to remove
          const nodesToRemove = currentNodesIds.filter((nodeId: number) => !taskIds.includes(nodeId.toString()));

          // Inactive nodes
          if (nodesToRemove.length > 0) {
            const delNodeConnect = await manager.delete(NodeConnectionModel, {nodeIdChild: nodesToRemove[0]});
            if (delNodeConnect) {
              let dNode = `UPDATE twf_node
                        SET is_active = 'N'
                        WHERE node_id = ${nodesToRemove[0]}`;
              await manager.query(dNode);
            }

          }
        }


     }
console.log ("aqui tiene q entrar a volver a insertar");
     //armamos las relaciones
     if (nodeRefIds.length === 0) {

     }else{
       for (const nodeId of nodeRefIds) {
        // if (nodes[`${nodeId}`]) {
           if(nodeId==='new' ){
             //get information about Action
             const newAction = await ActionModel.findOne({ code: nodes[`${nodeId}`].action.code });

             const newNode = manager.create(NodeModel, {
               nodeId : undefined,
               flowId: nodes[`${nodeId}`].flowId,
               isInit: 'N',
               actionId: newAction.actionId
             });
             const saveNode = await manager.save(newNode);
             id = saveNode.nodeId;
           }else{
             id = parseInt(nodeId.split("-")[1]);
           }


           //save in node and node_connection
           const newConnection = manager.create(NodeConnectionModel, {
             nodeConnectionId : undefined,
             nodeIdMaster: masterId,
             nodeIdChild: id,
           });

           masterId= id;
           const savedNodes = await manager.save(newConnection);
           // }

         }

       //}
     }


   console.log ("fin de funcion");
    return {success:true}
  }


  @Get()
  @DbSettings('Orm')
  @ReadOnly(true)
  @Log(true)
  async getFlowRender(params: Record<string, any>): Promise<unknown> {
    
    let actions = await getManager()
        .createQueryBuilder(ActionModel, "a")
        .select([
          "a.actionId",
          "a.code",
          "a.name",
          "a.description",
          "at.name"
        ])
        .innerJoin("a.actionType", "at")
        .where(`a.isActive = 1 and a.hidden = 'N'`)
        .getMany();
    
    const connections = await getManager()
        .createQueryBuilder(NodeConnectionModel, "nc")
        .select([
          "nc.nodeIdMaster",
          "nc.nodeIdChild",
        ])
        .innerJoin("nc.childNode", "cn")
        .where(`cn.isActive = 1 and cn.flowId = :flowId`, { flowId: params.flowId as number })
        .getMany();

    const nodes = await getManager()
        .createQueryBuilder(NodeModel, "n")
        .select([
          "n.nodeId",
          "n.flowId",
          "a.code",
          "a.name",
          "a.description",
        ])
        .innerJoin("n.action", "a")
        .where(`n.isActive = 1 and n.flowId = :flowId`, { flowId: params.flowId as number })
        .getMany();

    let sortedNodes = this.sortNodesByConnections(nodes, connections);

    actions.forEach((item:any) => {
      item.actionId = `action-${item.actionId}`;
    });

    sortedNodes.forEach((item:any) => {
      item.nodeId = `node-${item.nodeId}`;
    });

    const actionIds = actions.map((item:any) =>item.actionId);
    const nodeIds = sortedNodes.map((item:any) =>item.nodeId);

    sortedNodes = sortedNodes.map(({ nodeId, ...rest }) => {
      return { id: nodeId, ...rest };
    });

    const modActions = actions.map(({ actionId, ...rest }) => {
      return { id: actionId, type: 'template', ...rest };
    });

    const tasks = [...modActions, ...sortedNodes];

    const tasksObject = tasks.reduce((acc, obj) => {
      acc[obj.id] = obj;
      return acc;
    }, {});

    let response: any = {
      board: {
        columns: {
          "1-column-config-nodes": {
            id: "1-column-config-nodes",
            name: "Add Nodes",
            taskIds: actionIds,
          },
          "2-column-nodes-configured": {
            id: "2-column-nodes-configured",
            name: "Test Flow",
            taskIds: nodeIds,
          }
        },
        tasks: tasksObject,
        ordered: [
          "1-column-config-nodes",
          "2-column-nodes-configured"
       ],
      }

    };
    return response;
  }

  sortNodesByConnections(nodes: any[], connections: any[]): any[] {
    const nodeMap: Map<number, Node> = new Map();
    nodes.forEach((node) => nodeMap.set(node.nodeId, node));
  
    const sortedNodes: Node[] = [];
    const visitedNodes: Set<number> = new Set();
  
    function dfs(nodeId: number) {
      visitedNodes.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (node) {
        sortedNodes.push(node);
      }
  
      const connectedNodes = connections.filter(
        (connection) => connection.nodeIdMaster === nodeId
      );
  
      connectedNodes.forEach((connection) => {
        if (!visitedNodes.has(connection.nodeIdChild)) {
          dfs(connection.nodeIdChild);
        }
      });
    }
  
    connections.forEach((connection) => {
      if (connection.nodeIdMaster === null && !visitedNodes.has(connection.nodeIdChild)) {
        dfs(connection.nodeIdChild);
      }
    });
  
    return sortedNodes;
  }



}

export default Flow;
