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
 * 15-Aug-2023    SP25AUG23     Rensi Arteaga          Add logic to duplicate flows templates nadd icons
 * 17-Aug-2023    SP25AUG23     Mercedes Zambrana      Add insertEventFlow
 * 18-Aug-2023    SP25AUG23     Mercedes Zambrana      Add removeFlow
 * 01-Sep-2023    SP08SEP23     Rensi Arteaga          add base flow list
 * 16-Sep-2023    SP22SEP23     Mercedes Zambrana       Change GET to POST in insertEventFlow
 * 28-Sep-2023    SP06OCT23     Mercedes Zambrana      Add Validation when change off status (validateFlow, deleteflow, saveFlow, saveflowName)
 * ******************************************************************************
 */

import { EntityManager, getManager, In , FindManyOptions, SelectQueryBuilder } from 'typeorm';

import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get, PxpError
} from '@pxp-nd/core';
import * as _ from 'lodash';
import NodeModel from '../entity/Node';
import ActionModel from '../entity/Action';
import NodeConnectionModel from '../entity/NodeConnection';
import FlowModel from '../entity/Flow';
import FlowInstanceModel from '../entity/FlowInstance';
import NodeInstanceModel from '../entity/NodeInstance';
//import {configFacebookStrategy} from "./passport-facebook";


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
    const connections = await __(NodeConnectionModel.find({ nodeIdMaster: nodeId, isActive: true }));

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
  async copyNode(node: Record<any, any>, newFlowId: number, manager: EntityManager, isFirst: boolean = false) {

    // insert new node
    const newNode = new NodeModel();
    const { nodeId, flowId, createdAt, modifiedAt, ...nodeToCopy } = node;
    Object.assign(newNode, { ...nodeToCopy, flowId: newFlowId });
    const insertNewNode = await __(manager.save(NodeModel, newNode));
    if (isFirst) {
      const duplicatedConnection = manager.create(NodeConnectionModel, {
        nodeConnectionId : undefined,
        nodeIdMaster: undefined,
        nodeIdChild: insertNewNode.nodeId,
      });
      await manager.save(duplicatedConnection);
    }
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
    newFlow.status = 'off';
    newFlow.modifiedAt = new Date();
    newFlow.modifiedBy = this.user.username
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
      if (dataFlow.status =='on') {
        throw new PxpError(400, 'Your flow is on. It is not possible to delete it');
      }

      dataFlow.isActive = 0 as number;
      dataFlow.enabled = 'N';
      dataFlow.modifiedAt = new Date();
      dataFlow.modifiedBy = this.user.username
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
    if (dataFlow) {
      if (dataFlow.status =='on') {
        throw new PxpError(400, 'Your flow is on. It is not possible to change the name');
      }

      dataFlow.name = params.name;
      dataFlow.modifiedAt = new Date();
      dataFlow.modifiedBy = this.user.username
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

    if (flowData) {
      const flowToClone = {
        ...flowData,
        flowId: undefined as any,
        nodes: [] as any[],
        createdAt: new Date(),
        modifiedAt: new Date(),
        status: 'off'
      }

      let flowDataClone:any

       //if we have a vendoId as parameter the origin is a template
      if(params.vendorId) {
         flowDataClone = await manager.save(FlowModel, {...flowToClone, name: `${params.name}`, vendorId: params.vendorId, type: 'custom'});
      } else {
         flowDataClone = await manager.save(FlowModel, {...flowToClone, name: `${flowData.name} Copy`});
      }

      const dataNode = await NodeModel.findOne({ where: {flowId: params.flowId, isInit: 'Y', isActive: true }, order: {nodeId: "ASC"}});
      dataNode && await this.copyNode(dataNode, flowDataClone.flowId, manager, true);
      return { success:true, flowId: flowDataClone.flowId }
    }else{
      return { success:false, "respuesta": "No Flow" }
    }

  }






  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async saveFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    let nodeRefIds = params.board.columns['2-column-nodes-configured'].taskIds;

     let nodes = params.board.tasks?params.board.tasks:[];


     let masterId = null;
     let id = null;
     let newId = null;
     let flowId = null;
     let allowModify = false;
     let dataFlow =null;

     let taskIds:any = [];
     if (nodeRefIds.length === 0) {

       let nodeDelIdd = parseInt(params.board.deleteId.split("-")[1]);
       const lastNoded = await NodeModel.findOne({
         where: {
           nodeId: nodeDelIdd
         }
       });
       flowId= lastNoded.flowId;


       dataFlow = await __(FlowModel.findOne(flowId));
       if (dataFlow.status=='off'){
         allowModify=true;
       }


     }else{

         for (const nodeId of nodeRefIds) {

           if (nodeId != 'new') {
             id = parseInt(nodeId.split("node-")[1]);

             if (!id){
               const lastNode = await NodeModel.findOne({
                 where: {
                   flowId: flowId,
                 },
                 order: {
                   nodeId: 'DESC', // Ordena por ID en orden descendente para obtener el último registro
                 },
               });

               id = lastNode.nodeId;
             }

             taskIds.push(id);

             if(!flowId){
               const DataFlowId:any = await NodeModel.findOne({
                 where: {
                   nodeId: id,
                 }
               });
               flowId=DataFlowId.flowId;

             }

             dataFlow = await __(FlowModel.findOne(flowId));
             if (dataFlow.status=='off'){
               allowModify=true;
               const connectionsToDel = await manager.find(NodeConnectionModel, {
                 where: {nodeIdChild: id}
               });


               if (connectionsToDel) {

                 const originalNodeCIds = connectionsToDel.map((node: any) => node.nodeConnectionId);





                 let flowNodeC = await getManager().query(`DELETE
                                                       from twf_node_connection
                                                       WHERE node_connection_id = ${originalNodeCIds}`);

               }

             }



           }else{
             taskIds.push('new');
           }
         }


     }

     if (params.board.origin =='deleteTask') {
        let nodeDelId = parseInt(params.board.deleteId.split("-")[1]);

        if (nodeDelId){
          const flowIdDel= await NodeModel.findOne({nodeId: nodeDelId});

          flowId=flowIdDel.flowId;


          dataFlow = await __(FlowModel.findOne(flowId));
          if (dataFlow.status=='off'){
            allowModify=true;
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
          }else{
            throw new PxpError(400, 'AAA: Please turn off the flow before make a change');
          }


        }
     }

     if (nodeRefIds.length === 0) {

     }else{

       dataFlow = await __(FlowModel.findOne(flowId));
       if (dataFlow.status=='off') {
         allowModify = true;

         for (const nodeId of taskIds) {

           if (nodeId === 'new') {
             //get information about Action
             const newAction = await ActionModel.findOne({code: nodes[`${nodeId}`].action.code});

             const newNode = manager.create(NodeModel, {
               nodeId: undefined,
               flowId: nodes[`${nodeId}`].flowId,
               isInit: 'N',
               actionId: newAction.actionId
             });
             const saveNode = await manager.save(newNode);
             id = saveNode.nodeId;
             newId = saveNode.nodeId;
           } else {
             id = nodeId;
           }


           //save in node and node_connection
           const newConnection = manager.create(NodeConnectionModel, {
             nodeConnectionId: undefined,
             nodeIdMaster: masterId,
             nodeIdChild: id,
           });

           masterId = id;
           const savedNodes = await manager.save(newConnection);

         }
       }else{
         throw new PxpError(400, 'Please turn off the flow before make a change');
       }

     }


     if (dataFlow && allowModify) {
        dataFlow.modifiedAt = new Date();
        dataFlow.modifiedBy = this.user.username
        await __(manager.save(dataFlow));
     }

     return {success:true, nodeId: newId}
  }


  @Get()
  @Post()
  @DbSettings('Orm')
  @ReadOnly(true)
  @Log(true)
  async getFlowRender(params: Record<string, any>): Promise<unknown> {

    const flow = await getManager().findOne(FlowModel, params.flowId as number);
    const totalNodes =  await getManager()
        .createQueryBuilder(NodeModel, "n")
        .select([
          "n.nodeId",
          "a.originName"
        ])
        .innerJoin("n.action", "a")
        .where(`n.isActive = 1 and n.flowId = :flowId`, { flowId: params.flowId as number })
        .getOne();

    let cond = " and 0=0";

    if (!totalNodes){
      cond =  " and at.name= 'EVENT' ";
    }else{
      const oName= totalNodes?.action?.originName;
//
      cond = `and at.name != 'EVENT' and (a.originName is null or a.originName = '${oName}')`;
    }

    let actions = await getManager()
        .createQueryBuilder(ActionModel, "a")
        .select([
          "a.actionId",
          "a.code",
          "a.name",
          "a.description",
          "a.icon",
          "at.name"
        ])
        .innerJoin("a.actionType", "at")
        .where(`a.isActive = 1 and a.hidden = 'N'` + cond)
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
          "a.icon",
        ])
        .innerJoin("n.action", "a")
        .where(`n.isActive = 1 and n.flowId = :flowId`, { flowId: params.flowId as number })
        .getMany();

    let sortedNodes = this.sortNodesByConnections(nodes, connections);

    actions.forEach((item:any) => {
      item.actionId = `action-${item.actionId}`;
    });

    sortedNodes.forEach((item:any) => {
      item.node = {nodeId: item.nodeId}
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
      flow,
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



  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async insertEventFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    let dataFlow = await __(FlowModel.findOne(params.flowId));
    if (dataFlow){

      let action = await getManager()
          .createQueryBuilder(ActionModel, "a")
          .select([
            "a.actionId"
          ])
          .innerJoin("a.actionType", "at")
          .where(`a.isActive = 1 and a.hidden = 'N' and at.name = 'EVENT' and at.isActive = 1 `, { actionId: params.actionId as number } )
          .getMany();

      if (action){
         const newNode = manager.create(NodeModel, {
          nodeId : undefined,
          flowId: params.flowId,
          isInit: 'Y',
          actionId: params.actionId
        });
        const saveNode = await manager.save(newNode);
        const id = saveNode.nodeId;

        const newConnection = manager.create(NodeConnectionModel, {
          nodeConnectionId : undefined,
          nodeIdMaster: null,
          nodeIdChild: id,
        });
        dataFlow.modifiedAt = new Date();
        dataFlow.modifiedBy = this.user.username
        await __(manager.save(dataFlow));
        const savedNodes = await manager.save(newConnection);
        return {success:true, nodeId: id}
      } else {
        return { success : false, msg: "Action not found or is not event type" };
      }

    } else {
      return { success : false , msg: "Flow not found"};
    }

  }




  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async removeFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    const flowId = params.flowId;
    let dataFlow = await __(FlowModel.findOne(flowId));
    if (dataFlow) {

      const nodesToDelete = await manager.find(NodeModel, {flowId});


      const nodeIdsToDelete = nodesToDelete.map(node => node.nodeId);
      const nodeConnectionsToDelete = await manager.find(NodeConnectionModel, {
        where: [
          {nodeIdMaster: In(nodeIdsToDelete)},
          {nodeIdChild: In(nodeIdsToDelete)}
        ]
      });


      await manager.remove(nodeConnectionsToDelete);


      await manager.remove(nodesToDelete);


      await manager.remove(dataFlow);

      return {success: true};
    } else {
      return {success: false}
    }

  }


  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async changeStatusFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    let dataFlow = await __(FlowModel.findOne(params.flowId));

    if (dataFlow){
      if (dataFlow.status ==='off' ){
        await this.validateFlow(params.flowId as number, manager, 'on' );
        //change to active
         dataFlow.status = 'on';
      }else {
        await this.validateFlow(params.flowId as number, manager, 'off' );
         dataFlow.status = 'off';
      }

      dataFlow.modifiedAt = new Date();
      dataFlow.modifiedBy = this.user.username

      const updFlow = await __(manager.save(dataFlow));
      return {success : true}
    }else{
      return { success : false }
    }

  }

  async validateFlow(flowId: number, manager: EntityManager, status: string): Promise<unknown> {

    if (status == 'on'){
      const nodes = await NodeModel.find({ flowId, isActive: true });
      let res = '';
      if (nodes.length < 2) {
        throw new PxpError(400, 'Your flow must have at least 2 steps. Please finish configuring it before start');
      }
      for (const node of nodes) {
        const configActionType = !node.action.actionType.schemaJson ? {} :  JSON.parse(node.action.actionType.schemaJson);

        const configAction = !node.action.schemaJson ? {} : JSON.parse(node.action.schemaJson);
        const config = _.merge({}, configActionType, configAction);
        const required: string[] = [];
        for (const key in config) {
          if (config.hasOwnProperty(key)) {
            const prop = config[key];

            if (prop && typeof prop === "object" &&
                ((prop.validate && prop.validate.shape.includes('required')) ||
                    (prop.formComponent && prop.formComponent.validate && prop.formComponent.validate.shape.includes('required')))) {
              required.push(key);
            }
          }
        }

        const valueNode = !node.actionConfigJson ? {} : JSON.parse(node.actionConfigJson);
        const valueAction = !node.action.configJsonTemplate ? {} : JSON.parse(node.action.configJsonTemplate);
        const values = _.merge({}, valueAction, valueNode);

        const missingRequired: string[] = [];
        required.forEach((property) => {
          if (!values.hasOwnProperty(property)) {
            missingRequired.push(property);
          }
        });

        if (missingRequired.length > 0) {
          res += `In node ${node.action.name} you have missing fields: ${missingRequired.join(', ')}, `
        }
      }
      if (res != '') {
        res = res.slice(0, -2);
        throw new PxpError(400, 'Please resolve these issues before starting the flow: ' + res);
      }
      return true;
    }else{


            const flowInstances = await FlowInstanceModel.find({ flowId, isActive: true});
            const validFlowInstances = [];
            for (const flowInstance of flowInstances) {
                if (flowInstance.status!='processed'){
                   validFlowInstances.push(flowInstance.flowInstanceId);
                }else{
                   let flowInstanceId = flowInstance.flowInstanceId;
                   const totalNI = await NodeInstanceModel.find({ flowInstanceId, isActive: true});
                   const nodeInstances = await getManager().transaction(async (transactionalEntityManager) => {
                   const queryBuilder: SelectQueryBuilder<NodeInstanceModel> = transactionalEntityManager.createQueryBuilder(NodeInstanceModel, 'node_instance');
                   queryBuilder
                      .where('node_instance.flowInstanceId = :flowInstanceId', { flowInstanceId })
                      .andWhere('((node_instance.status IS NULL AND node_instance.schedule = :schedule) OR (node_instance.status = :status AND node_instance.schedule != :schedule))', {
                        status: 'executed',
                        schedule: '0000-00-00 00:00:00',
                      });

                  return queryBuilder.getMany();
                });


                  if (totalNI.length > nodeInstances.length ) {
                    validFlowInstances.push(flowInstanceId);
                  }
                }


            }

            if (validFlowInstances.length > 0){
              throw new PxpError(400, 'Your flow have at least 1 instance active. Please finish it before change off')
            }

             return true;


    }
      
      
      


  }

  @Get()
  @DbSettings('Orm')
  @ReadOnly(true)
  @Log(true)
  async basicFlowList(params: Record<string, any>): Promise<unknown> {
    const isActive = params._isActive;
    const type = params._type;
    const vendorId = params._vendorId;
    const allowedColumns = ['name','description'];
    const queryBuilder:any = await getManager()
        .createQueryBuilder()
          .select([
            'f.flow_id as flowId ',
            'f.vendor_id as vendorId',
            'f.code as code',
            'f.name as name',
            'f.enabled as enabled',
            'f.type as type',
            'f.created_by as createdBy',
            'f.user_id_ai as userIdAi',
            'f.user_ai as userAi',
            'f.modified_by as modifiedBy',
            'f.created_at as createdAt',
            'f.modified_at as modifiedAt',
            'f.is_active as isActive',
            'f.description as description',
            'f.icon as icon',
            'f.status as status',
            'COUNT(fi.flow_instance_id) AS numberOfInstance',
          ])
          .from('twf_flow', 'f')
          .leftJoin('twf_flow_instance', 'fi', 'fi.flow_id = f.flow_id');

      // Optional filters
      if (isActive !== undefined) {
        queryBuilder.where('f.is_active = :isActive', { isActive });
      }
      if (type) {
        queryBuilder.andWhere('f.type = :type', { type });
      }

      if (vendorId) {
        queryBuilder.andWhere('f.vendor_id = :vendorId', { vendorId });
      }
      if (allowedColumns.includes(params.genericFilterFields)) {
         if (params.genericFilterFields && params.genericFilterValue) {
           queryBuilder.andWhere(`f.${params.genericFilterFields} LIKE :genericFilterValue`, { genericFilterValue: `%${params.genericFilterValue}%`});
         }
      }


      queryBuilder.groupBy([
        'f.flow_id',
        'f.vendor_id',
        'f.code',
        'f.name',
        'f.enabled',
        'f.type',
        'f.created_by',
        'f.user_id_ai',
        'f.user_ai',
        'f.modified_by',
        'f.created_at',
        'f.modified_at',
        'f.is_active',
        'f.description',
        'f.icon',
        'f.status',
      ]);

      // Sorting and pagination
      //queryBuilder.orderBy(`f.${params.sort}`, params.dir).skip(params.start).take(params.limit);

    // Sorting and pagination
    queryBuilder.orderBy(`f.${params.sort}`, params.dir);

    // Agrega manualmente la cláusula LIMIT y OFFSET
    queryBuilder.limit(params.limit).offset(params.start);


     const data = await  queryBuilder.getRawMany();



     // Construct the count query
     const countQuery =  await getManager()
               .createQueryBuilder()
               .select('COUNT(f.flow_id)', 'count')
               .from('twf_flow', 'f');

     // Optional filters for the count query
     if (isActive !== undefined) {
      countQuery.where('f.is_active = :isActive', { isActive });
     }
     if (type) {
      countQuery.andWhere('f.type = :type', { type });
     }
     if (vendorId) {
       countQuery.andWhere('f.vendor_id = :vendorId', { vendorId });
     }

    if (allowedColumns.includes(params.genericFilterFields)) {
      if (params.genericFilterFields && params.genericFilterValue) {
        countQuery.andWhere(`f.${params.genericFilterFields} LIKE :genericFilterValue`, { genericFilterValue: `%${params.genericFilterValue}%`});
      }
    }



       const totalCount = await countQuery.getRawOne();
       const count = totalCount.count;
       return {data, count}

    }

}

export default Flow;
