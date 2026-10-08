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
 *   ISSUE        DATE        NAME                DESCRIPTION
 *  9141239986   16-May-2025  Mercedes Zambrana   Save flagName and FlagValue
 *  EF-23        08-Oct-2026  Favio Figueroa      GET_LOCK instead of flag, skipped=200, axios timeout
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
import { withDbLock } from '../helpers/dbLock';

class FlowInstance extends Controller {

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async processPending(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    let flowInstanceIdProcessing = -1;
    const { acquired } = await withDbLock('wf_process_pending', async () => {
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
          // The lock is released by withDbLock's finally block
          const log = new FlowLog();
          log.errorCustomMessage = `Error executing ${flowInstanceIdProcessing} in FlowInstance-> processPending `;
          log.errorMessage =  error.message;
          log.stackTrace = error.stack || '';
          await getManager().save(log).catch(e => console.error('[flow] FlowLog save failed', e.message));
          throw new PxpError(400, 'Error processing flow: ' + flowInstanceIdProcessing);
      }
    });
    if (!acquired) {
      return { success: true, skipped: true, reason: 'already running' };
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
        await getManager().save(log).catch(e => console.error('[flow] FlowLog save failed', e.message));
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

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async insert(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    const { flowId, dataId, status, actionId, originName = '', originKey = '' , flagName, flagValue} = params;
    let flowInstance = new FlowInstanceModel();
    flowInstance.flowId = flowId;
    flowInstance.dataId = dataId;
    flowInstance.originName = originName;
    flowInstance.originKey = originKey;
    flowInstance.actionId = actionId;
    flowInstance.status = status;
    if (flagName !== undefined && flagValue !== undefined) {
      flowInstance.flagName = flagName;
      flowInstance.flagValue = flagValue;
    }

    flowInstance = await manager.save(
      FlowInstanceModel,
      flowInstance
    );
    return flowInstance;
  }
}

export default FlowInstance;
