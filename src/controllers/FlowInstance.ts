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
          const maxFlows = await GlobalData.findOne({ data : 'wf_max_concurrent_flows_process'});
          const flowInstances = await FlowInstanceModel.find({ take: (maxFlows && maxFlows.value) as unknown as number, where: [{ status: 'pending' }], order: { flowInstanceId: "ASC" }});
          for(const flowInstance of flowInstances) {
              flowInstanceIdProcessing = flowInstance.flowInstanceId;
              const node = await Node.findOne({ where: { actionId: flowInstance.actionId, flowId: flowInstance.flowId }});
              const CNodeInstance = new NodeInstanceController('flow-nd', NodeInstance);
              await CNodeInstance.RecursiveInstance({ node, flowInstance });
              await manager.update(FlowInstanceModel,
                    {flowInstanceId:flowInstance.flowInstanceId}, 
                    {status: 'processed'});
          }
      } catch(error) {

          flag.value = 'false';
          await getManager().save(flag);
          throw new PxpError(400, 'Error processing flow: ' + flowInstanceIdProcessing);
      }

      flag.value = 'false';
      await getManager().save(flag);
    }
    return { success: true }
  }
}

export default FlowInstance;
