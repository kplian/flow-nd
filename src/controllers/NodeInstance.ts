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
 *  ISSUE         DATE           AUTHOR              DESCRIPTION
 *  25-Apr-2025   8914754251     Mercedes Zambrana   Validate and use node?.action?.controllerFunction
 */

import { EntityManager, getManager } from "typeorm";
import moment from "moment";

import {
  Controller,
  Model,
  __,
  Log,
  Post,
  DbSettings,
  ReadOnly,
  Get,
  PxpError,
} from "@pxp-nd/core";
import NodeConnection from "../entity/NodeConnection";
import NodeInstanceModel from "../entity/NodeInstance";
import Node from "../entity/Node";
import FlowLog from "../entity/FlowLog";
import axios from "axios";
import ActionType from "../entity/ActionType";
import Action from "../entity/Action";
import _ from "lodash";
import FlowInstance from "../entity/FlowInstance";

//TODO replace this flow-nd need tobe independent library
import { GlobalData } from "@pxp-nd/common";

@Model("flow-nd/NodeInstance")
class NodeInstance extends Controller {
  async RecursiveInstance(params: Record<string, any>, manager: EntityManager): Promise<unknown> { console.log ("viene al nodeInstance");
    //https://lodash.com/docs/4.17.15#template
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    //todo after this we need to get the json variables and execute the view and conditions configured in the database
    const { node, flowInstance, eventNode } = params;

    try {
      const executeView = `select * from ${flowInstance.originName} where ${flowInstance.originKey} = ${flowInstance.dataId}`;

      const resExecuteView = await __(getManager().query(executeView));
      const resultFromOrigin = resExecuteView[0];

      //let mergeJson = {};
      let mergeJson: Record<string, any> = {};
      const {
        actionConfigJson,
        action: {
          configJsonTemplate,
          actionType: { schemaJson },
        },
      } = node;
      if (configJsonTemplate !== "" || actionConfigJson !== "") {
        const actionConfigJsonObject =
          actionConfigJson &&
          JSON.parse(_.template(actionConfigJson)(resultFromOrigin));
        const configJsonTemplateObject =
          configJsonTemplate &&
          JSON.parse(_.template(configJsonTemplate)(resultFromOrigin));
        mergeJson = {
          ...(configJsonTemplateObject || {}), // first object must be of the node table
          ...(actionConfigJsonObject || {}),
          __resultFromOrigin: resultFromOrigin,
          uniqueArgs: {
            flowInstance: flowInstance.flowInstanceId,
            nodeId: node.nodeId
          }
        };


      }

      let nodeInstance = new NodeInstanceModel();
      nodeInstance.flowInstanceId = flowInstance.flowInstanceId;
      // @ts-ignore
      nodeInstance.nodeId = node.nodeId;
      nodeInstance.runTime = new Date();

      if (node.action.actionType.isDelay === "Y") {
        const delayData = JSON.parse(node.actionConfigJson);
        const delay = delayData.quantity;
        const typeDelay = delayData.type;
        nodeInstance.schedule = moment().add(delay, typeDelay).toDate();
        nodeInstance.status = "WAIT";
        await manager.save(NodeInstanceModel, nodeInstance);
      } else {
        if (node.action.actionType.controller) {
          const data = "";
          const res = await manager.save(NodeInstanceModel, nodeInstance);
          const nodeInstanceId = res.nodeInstanceId;


          if (nodeInstanceId){
            mergeJson.nodeInstanceId = nodeInstanceId;
          }


          if (!!node?.action?.controllerFunction) {

            const config = {
              method: "post",
              url: `http://localhost:${process.env.PORT}/api/${node.action.controllerFunction}`,
              headers: {
                Authorization: "" + process.env.TOKEN_PXP_ND + "",
                "Content-Type": "application/json",
              },
              data: mergeJson,
            };

          }else{
            const config = {
              method: "post",
              url: `http://localhost:${process.env.PORT}/api/${node.action.actionType.controller}`,
              headers: {
                Authorization: "" + process.env.TOKEN_PXP_ND + "",
                "Content-Type": "application/json",
              },
              data: mergeJson,
            };
          }


          // @ts-ignore
          const resControllerAxios = await __(axios(config));

          if ('data' in resControllerAxios && resControllerAxios.data) {
             const response = resControllerAxios.data;
            if ('tokenId' in response && response.tokenId) {
              nodeInstance.extraArgs = { tokenId: response.tokenId };
              await manager.save(NodeInstanceModel, nodeInstance);
            }

          }


        }


        // @ts-ignore
        const nodeConnectionList = await __(
          NodeConnection.find({ where: { nodeIdMaster: node.nodeId } })
        );

        for (const nodeConnection of nodeConnectionList) {
          const condition = _.template(nodeConnection.condition)(
            resultFromOrigin
          );
          const evalCondition = eval(condition) as boolean;
          if (!nodeConnection.condition || evalCondition) {
            const nodeRes = await __(Node.findOne(nodeConnection.nodeIdChild));
            await this.RecursiveInstance({
              node: nodeRes,
              flowInstance,
              resultFromOrigin,
            }, manager);
          }
        }
      }
    } catch (error) {
      const log = new FlowLog();
      log.errorCustomMessage = `Error executing ${flowInstance.flowInstanceId} in NodeInstance-> RecursiveInstance `;
      log.errorMessage =  error.message;
      log.stackTrace = error.stack || '';
      getManager().save(log);
    }

    return {};
  }

  @Post()
  @DbSettings("Orm")
  @ReadOnly(false)
  @Log(true)
  async ProcessDelay(
    params: Record<string, any>,
    manager: EntityManager
  ): Promise<unknown> {
    const flag = await GlobalData.findOne({
      data: "wf_processing_delay_nodes_flag",
    });
    if (flag) {
      if (flag.value == "true") {
        throw new PxpError(400, "Already processing pending flows");
      }
      flag.value = "true";
      await getManager().save(flag);
      let nodeInstanceIdProcessing = -1;
      try {
        const maxNodes = await GlobalData.findOne({
          data: "wf_max_concurrent_delay_process",
        });
        const nodeInstanceDelayData = await __(
          manager
            .createQueryBuilder(NodeInstanceModel, "ni")
            .innerJoin(Node, "n", "n.nodeId = ni.nodeId")
            .innerJoin(Action, "a", "a.actionId = n.actionId")
            .innerJoin(ActionType, "at", "at.actionTypeId = a.actionTypeId")
            .where("at.isDelay = 'Y' ")
            .andWhere("ni.schedule <= :start ", { start: new Date() })
            .andWhere("ni.status = 'WAIT' ")
            .limit((maxNodes && maxNodes.value) as unknown as number)
            .getMany()
        );

        for (const nodeInstance of nodeInstanceDelayData) {
          //update status from wait to executing
          await __(
            manager.update(NodeInstanceModel, nodeInstance.nodeInstanceId, {
              status: "EXECUTING",
            })
          );

          const nodeConnectionList = await __(
            NodeConnection.find({
              where: { nodeIdMaster: nodeInstance.nodeId as number },
            })
          );

          const flowInstance = await __(
            FlowInstance.findOne(nodeInstance.flowInstanceId)
          );
          const resultFromOrigin = JSON.parse(flowInstance.resultFromOrigen);

          // todo if in some transaction there is an error we need to put in some log to error and not try only some times
          for (const nodeConnection of nodeConnectionList) {
            // todo create transaction for own node
            const nodeRes = await __(Node.findOne(nodeConnection.nodeIdChild));
            try {
              await this.RecursiveInstance({
                node: nodeRes,
                flowInstance,
                resultFromOrigin,
              }, manager);
              //update status from wait to executed
              await __(
                manager.update(NodeInstanceModel, nodeInstance.nodeInstanceId, {
                  status: "EXECUTED",
                })
              );
            } catch (error) {
              console.log(error);
              await manager.update(
                NodeInstanceModel,
                nodeInstance.nodeInstanceId,
                {
                  status: "ERROR",
                }
              );
            }
          }
        }
      } catch (error) {
        flag.value = "false";
        await getManager().save(flag);
        throw new PxpError(
          400,
          "Error processing node: " + nodeInstanceIdProcessing
        );
      }
      flag.value = "false";
      await getManager().save(flag);
    }
    return { success: true };
  }
}

export default NodeInstance;
