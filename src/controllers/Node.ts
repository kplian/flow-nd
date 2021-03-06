/**
 * Effex 2021
 *
 * MIT
 *
 * Member Controller
 *
 * @summary Member Controller
 * @author Favio Figueroa
 *
 * Created at     : 2021-07-08 12:55:38
 * Last modified  :
 */

import {EntityManager, getManager, IsNull, Not} from 'typeorm';
import NodeModel from '../entity/Node';
import NodeConnectionModel from '../entity/NodeConnection';
import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get
} from '@pxp-nd/core';
import NodeInstanceModel from "../entity/NodeInstance";
import _ from 'lodash';
import FieldMapEntity from "../entity/FieldMap";
import OriginNameEntity from "../entity/OriginName";
import axios from 'axios';


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
    const upd = await __(manager.update(NodeModel, params.nodeId, {
      actionConfigJson: JSON.stringify(actionConfigJson),
    }));
    return {
      actionConfigJson,
      success: true,
      nodeId: params.nodeId,
      upd
    }
  }

  @Post()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async getParameterizedNode(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

    const { nodeId, flowId, substitutionsSchemaJson = {} } = params;
    const tNodeOrigin =  await __(NodeModel.findOne({
      relations: ['action'],
      where: {
        flowId: flowId,
        isInit: 'Y',
        action: {
          originName: Not(IsNull())
        }
      }
    }));
    const tNodeData =  __(NodeModel.findOne(nodeId));
    const tFieldMapData =  __(manager.createQueryBuilder(FieldMapEntity, 'fm')
        .innerJoin(OriginNameEntity, 'on', 'on.originNameId = fm.originNameId')
        .where("on.name = :n ", {n: tNodeOrigin.action.originName})
        .getMany());

    //const nodeOrigin = await tNodeOrigin; todo
    const nodeData = await tNodeData;
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
        const url: string = json.formComponent.store.axios.url as string;
        const method: string = json.formComponent.store.axios.method as string;
        const data = json.formComponent.store.axios.data;
        const idDD = json.formComponent.store.idDD;
        const descDD = json.formComponent.store.descDD;

        const config = {
          method: method,
          url: url,
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
        const descValue = await __(findFieldInConfigForComponent(schemaJsonObject[nameKey], value));
        schemaJsonObject[nameKey] = {
          ...schemaJsonObject[nameKey],
          initialValue: value,
          ...(descValue && { descValue: descValue }),
          ...(verifyIfValueFromFieldMap(value as string) && { fromFieldMap: true, ...findFieldMapAndMetaData(value) }),
        }
      }
    }

    Object.entries(schemaJsonObject)
        .filter(([, value]: [nameKey: string, value: any]) => value.initialValue === undefined && value.fromFieldMap === undefined && value.fieldMappingType)
        .forEach(([nameKey]) => {
          const hasUniqueByTypeInMappingData = findFieldMapUniqueByType(schemaJsonObject[nameKey].fieldMappingType);
          schemaJsonObject[nameKey] = {
            ...schemaJsonObject[nameKey],
            ...(hasUniqueByTypeInMappingData && { fromFieldMap: true, ...hasUniqueByTypeInMappingData }),
          };
        })

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
