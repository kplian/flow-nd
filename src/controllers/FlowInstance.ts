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
  Model, __, Log, Post, DbSettings, ReadOnly, Get, PxpError
} from '@pxp-nd/core';
import FlowInstanceModel from '../entity/FlowInstance';
import { GlobalData } from '@pxp-nd/common';
import NodeInstanceController from './NodeInstance';
import NodeInstance from '../entity/NodeInstance';
import Node from '../entity/Node';
import Event from "../entity/Event";
import Flow from "../entity/Flow";
import Action from "../entity/Action";
import FlowLog from "../entity/FlowLog";

class FlowInstance extends Controller {

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async processPending(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    const flag = await GlobalData.findOne({ data : 'wf_processing_pending_flows_flag'});
    if (flag){
      if (flag.value == 'true') {
          throw new PxpError(400, 'Already processing pending flows');
      }
      flag.value = 'true';
      let flowInstanceIdProcessing = -1;
      await getManager().save(flag);
      try {
          await this.eventProcesss(manager);
          const maxFlows = await GlobalData.findOne({ data : 'wf_max_concurrent_flows_process'});
          const flowInstances = await manager.find(FlowInstanceModel, { take: (maxFlows && maxFlows.value) as unknown as number, where: [{ status: 'pending' }], order: { flowInstanceId: "ASC" }});
          for(const flowInstance of flowInstances) {
              flowInstanceIdProcessing = flowInstance.flowInstanceId;
              const node = await Node.findOne({ where: { actionId: flowInstance.actionId, flowId: flowInstance.flowId }});
              const CNodeInstance = new NodeInstanceController('flow-nd', NodeInstance);
              try {
                await CNodeInstance.RecursiveInstance({ node, flowInstance }, manager);
                await manager.update(FlowInstanceModel,
                    {flowInstanceId:flowInstance.flowInstanceId}, 
                    {status: 'processed'});
              } catch(error) {
                console.log(error);
                await manager.update(FlowInstanceModel,
                    {flowInstanceId:flowInstance.flowInstanceId}, 
                    {status: 'error'});
              }
              
              await manager.update(FlowInstanceModel,
                    {flowInstanceId:flowInstance.flowInstanceId}, 
                    {status: 'processed'});
          }
      } catch(error) {

          flag.value = 'false';
          await getManager().save(flag);
          const log = new FlowLog();
          log.errorCustomMessage = `Error executing ${flowInstanceIdProcessing} in FlowInstance-> processPending `;
          log.errorMessage =  error.message;
          log.stackTrace = error.stack || '';
          getManager().save(log);
          throw new PxpError(400, 'Error processing flow: ' + flowInstanceIdProcessing);
      }

      flag.value = 'false';
      await getManager().save(flag);
    }
    return { success: true }
  }

  async eventProcesss(manager: EntityManager) {
    
    const pendingEvents = await Event.find({ status: 'pending' });

    for (const newEvent of pendingEvents) {
      const node = await __(
        Node.find({ where: { actionId: newEvent.actionId, isActive: 1 } })
      );
      newEvent.status = 'processed';
      await getManager().save(newEvent);
      try {
        for (const n of node) {
          //get data of view
          const {
            action: { originName, originKey },
          } = n;
          const executeView = `select * from ${originName} where ${originKey} = ${newEvent.dataId}`;
          const resExecuteView = await getManager().query(executeView);
          const flow = await __(Flow.findOne({ where: { flowId: n.flowId, isActive: 1, status: 'on' } }));
          if (
            flow && flow.vendorId == resExecuteView[0].vendor_id &&
            (await this.checkConditions(
              resExecuteView[0],
              n.flowId,
              newEvent.actionId
            ))
          ) {
            //now check all conditions
            let flowInstance = new FlowInstanceModel();
            flowInstance.flowId = n.flowId;
            flowInstance.dataId = newEvent.dataId;
            flowInstance.originName = originName;
            flowInstance.originKey = originKey;
            flowInstance.actionId = newEvent.actionId;
            flowInstance.status = "pending";
            flowInstance = await manager.save(
              FlowInstanceModel,
              flowInstance
            );
          }
        }
      } catch (error) {
        const log = new FlowLog();
        log.errorCustomMessage = `Error processing event ${newEvent.eventId} in FlowInstance-> eventProcesss `;
        log.errorMessage =  error.message;
        log.stackTrace = error.stack || '';
        getManager().save(log);
      }
    }
  }

  async checkConditions(
    viewData: Record<string, any>,
    flowId: number,
    actionId: number
  ) {
    const action = await Action.findOne(actionId);
    const node = await Node.findOne({ where: { actionId, flowId, isActive: 1 } });

    let res = true;
    if (node && action.eventConfig && node.actionConfigJson) {
      const eventConfig = JSON.parse(action.eventConfig);
      const actionConfigJson = JSON.parse(node.actionConfigJson);
      if (eventConfig.filters) {
        eventConfig.filters.forEach((filter: Record<string, any>) => {
          if (
            actionConfigJson[filter.nodeField] &&
            viewData[filter.originField] != actionConfigJson[filter.nodeField]
          ) {
            res = false;
          }
        });
      }
    }
    return res;
  }
}

export default FlowInstance;
