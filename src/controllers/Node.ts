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
    console.log('params', params)
    let { nodeId: removed, __metadata: removed2, ...actionConfigJson } = params;
    Object.entries(params.__metadata).forEach(([nameKey, values]: [nameKey: string, values:any]) => {
      actionConfigJson[nameKey] = `{{ ${values.name} }}`
    });
    console.log('actionConfigJson',actionConfigJson)
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

  @Get()
  @DbSettings('Orm')
  @ReadOnly(false)
  @Log(true)
  async getParameterizedNode(params: Record<string, any>, manager: EntityManager): Promise<unknown> {
    const { nodeId, flowId } = params;
    /*const tNodeOrigin =  __(NodeModel.find({
      relations: ['action'],
      where: {
        flowId: flowId,
        action: {
          originName: Not(IsNull())
        }
      }
    }));*/
    const tNodeData =  __(NodeModel.findOne(nodeId));
    const tFieldMapData =  __(manager.createQueryBuilder(FieldMapEntity, 'fm')
        .innerJoin(OriginNameEntity, 'on', 'on.originNameId = fm.originNameId')
        .where("on.name = :n ", {n: 'v_member'})
        .getMany());

    //const nodeOrigin = await tNodeOrigin; todo
    const nodeData = await tNodeData;
    const fieldMapData = await tFieldMapData;
    /*const [nodeData, fieldMapData] = await Promise.all([
      tNodeData,
      tFieldMapData
    ]);*/

    const {actionConfigJson, action: {  configJsonTemplate , actionType: { schemaJson }}} = nodeData;

    const actionConfigJsonObject = actionConfigJson ? JSON.parse(actionConfigJson) : {};
    const configJsonTemplateObject = configJsonTemplate ? JSON.parse(configJsonTemplate) : {};
    let schemaJsonObject = schemaJson ? JSON.parse(schemaJson) : {};

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
    Object.entries(mergeValues).forEach(([nameKey, value]) => {
      if(schemaJsonObject[nameKey]) {
        schemaJsonObject[nameKey] = {
          ...schemaJsonObject[nameKey],
          initialValue: value,
          ...(verifyIfValueFromFieldMap(value as string) && { fromFieldMap: true, ...findFieldMapAndMetaData(value) }),
        }
      }
    });


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
    console.log('params', params)
    const {nodeId, originName, originKey, fromValues} = params;
    // we need to get the value from merge values with originKey
    const getParameterizedNodeData = await __(this.getParameterizedNode({nodeId: nodeId }, manager));

    const { mergeValues } = getParameterizedNodeData;
    const findOriginValue = Object.entries(mergeValues).find(([nameValue]) => fromValues === nameValue);

    const resValueObject = Object.fromEntries([findOriginValue]);
    const originValue = resValueObject[fromValues];
    const executeViewString = `select * from ${originName} where ${originKey} = ${originValue}`;
    const resExecuteView = await getManager().query(executeViewString);

    console.log('mergeValues',mergeValues)
    console.log('findOriginValue',findOriginValue)
    console.log('executeViewString',executeViewString)
    /*const executeView = `select * from ${originName} where ${originKey} = ${newEvent.dataId}`;
    const resExecuteView = await getManager().query(executeView);*/
    return {
      ...resExecuteView[0]
    }
  }

}

export default Node;
