/**
 * Kplian 2021
 *
 * MIT
 *
 * NodeInstance Controller
 *
 * @summary Member Controller
 * @author Favio Figueroa
 *         Jaime Rivera
 *
 * Created at     : 2021-07-08 12:55:38
 * Last modified  :
 */

import { EntityManager, getManager } from 'typeorm';
import moment from 'moment';

import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get
} from '@pxp-nd/core';
import FlowInstanceModel from '../entity/FlowInstance';
import NodeConnection from '../entity/NodeConnection';
import NodeInstanceModel from '../entity/NodeInstance';
import Node from '../entity/Node';
import axios from 'axios';
import ActionType from '../entity/ActionType';
import Action from '../entity/Action';
import _ from 'lodash';
import Token from '../../hq-nd/controllers/Token';
import ConductorEmail from '../../hq-nd/controllers/ConductorEmail';
import FlowInstance from '../entity/FlowInstance';


@Model('flow-nd/NodeInstance')
class NodeInstance extends Controller {

  async RecursiveInstance(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    //todo after this we need to get the json variables and execute the view and conditions configured in the database
    const { node, flowInstance, resultFromOrigin } = params;

    console.log('resultFromOrigin', resultFromOrigin)

    let mergeJson = {};
    const { actionConfigJson, action: { configJsonTemplate, actionType: { schemaJson } } } = node;
    if (configJsonTemplate !== '' || actionConfigJson !== '') {
      console.log('configJsonTemplateObject', actionConfigJson)

      //https://lodash.com/docs/4.17.15#template
      _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
      const actionConfigJsonObject = actionConfigJson && JSON.parse(_.template(actionConfigJson)(resultFromOrigin));
      const configJsonTemplateObject = configJsonTemplate && JSON.parse(_.template(configJsonTemplate)(resultFromOrigin));
      mergeJson = {
        ...(configJsonTemplateObject || {}),// first object must be of the node table
        ...(actionConfigJsonObject || {}),
        __resultFromOrigin: resultFromOrigin
      }
      console.log('mergeJson', mergeJson)

    }


    let nodeInstance = new NodeInstanceModel();
    nodeInstance.flowInstanceId = flowInstance.flowInstanceId;
    // @ts-ignore
    nodeInstance.nodeId = node.nodeId;
    nodeInstance.runTime = new Date();

    if (node.action.actionType.isDelay === 'Y') {
      const delay = node.delay;
      const typeDelay = node.typeDelay;
      nodeInstance.schedule = moment().add(delay, typeDelay).toDate();
      nodeInstance.status = 'WAIT';
      console.log('llega 1')
      await manager.save(NodeInstanceModel, nodeInstance);

    } else {
      if (node.action.actionType.controller) {


        const data = '';

        console.log('mergeJson', mergeJson)


        const config = {
          method: 'post',
          url: `http://localhost:${process.env.PORT}/api/${node.action.actionType.controller}`,
          headers: {
            'Authorization': '' + process.env.TOKEN_PXP_ND + '',
            'Content-Type': 'application/json'
          },
          data: mergeJson
        };
        console.log('config', config)
        // @ts-ignore
        const resControllerAxios = await __(axios(config));
        console.log('resControllerAxios', resControllerAxios)


      }
      console.log('llega 2')
      await manager.save(NodeInstanceModel, nodeInstance);
      // @ts-ignore
      const nodeConnectionList = await __(NodeConnection.find({ where: { nodeIdMaster: node.nodeId } }));
      console.log('nodeConnectionList', nodeConnectionList)

      for (const nodeConnection of nodeConnectionList) {
        const nodeRes = await __(Node.findOne(nodeConnection.nodeIdChild))
        console.log('nodeRes', nodeRes)

        await this.RecursiveInstance({ node: nodeRes, flowInstance, resultFromOrigin }, manager);
      }

    }


    return {}
  }

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async ProcessDelay(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

    const nodeInstanceDelayData = await __(manager.createQueryBuilder(NodeInstanceModel, 'ni')
      .innerJoin(Node, 'n', 'n.nodeId = ni.nodeId')
      .innerJoin(Action, 'a', 'a.actionId = n.actionId')
      .innerJoin(ActionType, 'at', 'at.actionTypeId = a.actionTypeId')
      .where("at.isDelay = 'Y' ")
      .andWhere('ni.schedule <= :start ', { start: new Date() })
      .andWhere("ni.status = 'WAIT' ")
      .getMany()
    );

    console.log('nodeInstanceDelayData',nodeInstanceDelayData)
    for(const nodeInstance of nodeInstanceDelayData) {
      //update status from wait to executing
      await __(manager.update(NodeInstanceModel, nodeInstance.nodeInstanceId, {
        status: 'EXECUTING',
      }));

      console.log('nodeInstance',nodeInstance)
      const nodeConnectionList = await __(NodeConnection.find({ where: { nodeIdMaster: nodeInstance.nodeId as number } }));
      console.log('nodeConnectionList', nodeConnectionList)

      const flowInstance = await __(FlowInstance.findOne(nodeInstance.flowInstanceId));
      const resultFromOrigin = JSON.parse(flowInstance.resultFromOrigen);
      console.log('PROCESS DELAY resultFromOrigen', resultFromOrigin)

      // todo if in some transaction there is an error we need to put in some log to error and not try only some times
      for (const nodeConnection of nodeConnectionList) { // todo create transaction for own node
        const nodeRes = await __(Node.findOne(nodeConnection.nodeIdChild))
        console.log('nodeRes', nodeRes)

        await this.RecursiveInstance({ node: nodeRes, flowInstance, resultFromOrigin }, manager);
      }

      //update status from wait to executed
      await __(manager.update(NodeInstanceModel, nodeInstance.nodeInstanceId, {
        status: 'EXECUTED',
      }));



    }

    return {nodeInstanceDelayData}
  }
}

export default NodeInstance;
