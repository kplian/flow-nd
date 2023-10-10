/**
 * ******************************************************************************
 * NAME: Node.ts
 * DEVELOPER: Favio Figueroa
 * DESCRIPTION: Flow Controller
 * REVISIONS:
 * Date             Change ID     Author Description
 *  -------------- ----------- -------------- ------------------------------------
 * 08-Jul-2021                  Favio Figueroa          Created
 * 04-Sep-2023    SP08SEP23     Rensi Arteaga           add modifiedAt for flows
 * 29-Sep-2023    SP06OCT23     Mercedes Zambrana       Add validation when flow is on
 * ******************************************************************************
 */

import {EntityManager, getManager, IsNull, Not} from 'typeorm';
import NodeModel from '../entity/Node';
import NodeConnectionModel from '../entity/NodeConnection';
import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get, PxpError
} from '@pxp-nd/core';
import NodeInstanceModel from "../entity/NodeInstance";
import _ from 'lodash';
import FieldMapEntity from "../entity/FieldMap";
import OriginNameEntity from "../entity/OriginName";
import axios from 'axios';
import FlowModel from '../entity/Flow';

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

    let dataFlow = await __(FlowModel.findOne(params.flowId));
    if (dataFlow) {
      dataFlow.modifiedAt = new Date();
      dataFlow.modifiedBy = this.user.username
      await __(manager.save(dataFlow));
    }

    const { nodeId } = node;
    const nodeData = await manager.findOne(NodeModel, nodeId);
    return nodeData;
  }


  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async AddActionConfigJson(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    let { nodeId: removed, __metadata: removed2, ...actionConfigJson } = params;
    Object.entries(params.__metadata).forEach(([nameKey, values]: [nameKey: string, values:any]) => {
      actionConfigJson[nameKey] = `{{ ${values.name} }}`
    });
    let allowChange=false;
    let dataNode = await __(NodeModel.findOne(params.nodeId));
    if(dataNode) {
      let dataFlow = await __(FlowModel.findOne(dataNode.flowId));
      if (dataFlow) {
        if (dataFlow.status != 'on') {
          allowChange = true;

          dataFlow.modifiedAt = new Date();
          dataFlow.modifiedBy = this.user.username
          await __(manager.save(dataFlow));
        }


      }
    }
      if (allowChange) {
        const upd = await __(manager.update(NodeModel, params.nodeId, {
          actionConfigJson: JSON.stringify(actionConfigJson),
        }));

        return {
          actionConfigJson,
          success: true,
          nodeId: params.nodeId,
          upd,
          msg: `Changes have been saved successfully.`
        }
      }else{
       throw new PxpError(400, 'Please turn off the flow before make a change');
      }




  }

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async getParameterizedNode(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

    const { nodeId, flowId, substitutionsSchemaJson = {} } = params;
    const tNodeData =  __(NodeModel.findOne(nodeId));
    const nodeData = await tNodeData;

    const tNodeOrigin =  await __(NodeModel.findOne({
      relations: ['action'],
      where: {
        flowId: nodeData.flowId,
        isInit: 'Y',
        action: {
          originName: Not(IsNull())
        }
      }
    }));
    const tFieldMapData =  __(manager.createQueryBuilder(FieldMapEntity, 'fm')
        .innerJoin(OriginNameEntity, 'on', 'on.originNameId = fm.originNameId')
        .where("on.name = :n ", {n: tNodeOrigin.action.originName})
        .getMany());

    //const nodeOrigin = await tNodeOrigin; todo
    
    const fieldMapData = await tFieldMapData;
    /*const [nodeData, fieldMapData] = await Promise.all([
      tNodeData,
      tFieldMapData
    ]);*/

    const {actionConfigJson, action: { schemaJson, configJsonTemplate , actionType: { schemaJson: schemaJsonFromActionType }}} = nodeData;
    

    const actionConfigJsonObject = actionConfigJson ? JSON.parse(actionConfigJson) : {};
    const configJsonTemplateObject = configJsonTemplate ? JSON.parse(configJsonTemplate) : {};
    let schemaJsonFromActionTypeObject = schemaJsonFromActionType ? JSON.parse(_.template(schemaJsonFromActionType)(substitutionsSchemaJson)) : {};
    let schemaJsonFromActionObject = schemaJson ? JSON.parse(_.template(schemaJson)(substitutionsSchemaJson)) : {};
    let schemaJsonObject = {...schemaJsonFromActionTypeObject, ...schemaJsonFromActionObject};

    const mergeValues = {
      ...configJsonTemplateObject,
      ...actionConfigJsonObject
    };
    const verifyIfValueFromFieldMap = (str : string) => {
      if( /^{{/.test(str) && /}}$/.test(str) ) {
         return true;
      }
      return false;
    }
    const findFieldMapAndMetaData = (value: any) => {
      const found = fieldMapData.find((fmd: { name: any; }) => `{{ ${fmd.name} }}` === value) || {};
      return {
        initialValue: found.alias || value,
        metadata: found
      };
    }

    const findFieldMapUniqueByType = (fieldMappingType: string) => {
      const filtered = fieldMapData.filter((fmd: { type: string}) => fmd.type === fieldMappingType);

      if(filtered && filtered.length === 1) {
        const [found] = filtered;
        return {
          initialValue: found.alias,
          metadata: found
        };
      }
      return undefined;

    }
    // this logic is for autocomplete for moment
    const findFieldInConfigForComponent = async (json: Record<any, any>, value: any) => {
      if (json.formComponent && json.formComponent.type === 'AutoComplete') {
        const url: string = json.formComponent.store.axios.config.url as string;
        const method: string = json.formComponent.store.axios.config.method as string;
        const data = json.formComponent.store.axios.config.data;
        const idDD = json.formComponent.store.idDD;
        const descDD = json.formComponent.store.descDD;

        const config = {
          method: method,
          url: `http://localhost:${process.env.PORT}${url}`,
          headers: {
            'Authorization': '' + process.env.TOKEN_PXP_ND + '',
            'Content-Type': 'application/json'
          },
          data: {
            ...data,
            [idDD]: value
          }
        };

        // @ts-ignore
        const resControllerAxios = await __(axios(config));
        console.log('resControllerAxios',resControllerAxios)
        const desc = resControllerAxios.data.data[descDD];

        return desc;

      } else if(json.formComponentTemplate && json.configGetDescValue) { // todo we need to see how works here

        const {controller, storeId, descColumn} = json.configGetDescValue;
        const config = {
          method: "get",
          url: `http://localhost:${process.env.PORT}/api/${controller}`,
          headers: {
            'Authorization': '' + process.env.TOKEN_PXP_ND + '',
            'Content-Type': 'application/json'
          },
          data: {
            [storeId]: value
          }
        };

        // @ts-ignore
        const resControllerAxios = await __(axios(config));
        const desc = resControllerAxios.data.data[descColumn];
        return desc;
      }
      return undefined;
    }
    
    for (const [nameKey, value] of Object.entries(mergeValues)) {
      if(schemaJsonObject[nameKey]) {
        let descValue;
        if(value) {
          descValue = await __(findFieldInConfigForComponent(schemaJsonObject[nameKey], value));
        }
        schemaJsonObject[nameKey] = {
          ...schemaJsonObject[nameKey],
          initialValue: value,
          ...(descValue && { descValue: descValue }),
          ...(verifyIfValueFromFieldMap(value as string) && { fromFieldMap: true, ...findFieldMapAndMetaData(value) }),
        }
      }
    }
    //console.log('111 schemaJsonObject',schemaJsonObject)

    /*Object.entries(schemaJsonObject)
        .filter(([, value]: [nameKey: string, value: any]) => value.initialValue === undefined && value.fromFieldMap === undefined && value.fieldMappingType)
        .forEach(([nameKey]) => {
          const hasUniqueByTypeInMappingData = findFieldMapUniqueByType(schemaJsonObject[nameKey].fieldMappingType);
          schemaJsonObject[nameKey] = {
            ...schemaJsonObject[nameKey],
            ...(hasUniqueByTypeInMappingData && { fromFieldMap: true, ...hasUniqueByTypeInMappingData }),
          };
        })*/
//    console.log('222 schemaJsonObject',schemaJsonObject)


    return {
      actionConfigJsonObject,
      configJsonTemplateObject,
      mergeValues,
      schemaJsonObject,
      schemaJson,
      node: nodeData,
      fieldMapData,
    };
  }

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async executeActionJson(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    const {nodeId, originName, originKey, fromValues} = params;
    // we need to get the value from merge values with originKey
    const getParameterizedNodeData = await __(this.getParameterizedNode({nodeId: nodeId }, manager));

    const { mergeValues } = getParameterizedNodeData;
    const findOriginValue = Object.entries(mergeValues).find(([nameValue]) => fromValues === nameValue);

    const resValueObject = Object.fromEntries([findOriginValue]);
    const originValue = resValueObject[fromValues];
    const executeViewString = `select * from ${originName} where ${originKey} = ${originValue}`;
    const resExecuteView = await getManager().query(executeViewString);

    /*const executeView = `select * from ${originName} where ${originKey} = ${newEvent.dataId}`;
    const resExecuteView = await getManager().query(executeView);*/
    return {
      ...resExecuteView[0]
    }
  }

}

export default Node;
