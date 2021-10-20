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

import { EntityManager, getManager } from 'typeorm';

import {
  Controller,
  Model, __, Log, Post, DbSettings, ReadOnly, Get
} from '@pxp-nd/core';
import NodeModel from "../entity/Node";
import NodeConnectionModel from "../entity/NodeConnection";
import NodeInstanceModel from "../entity/NodeInstance";
import Node from "../entity/Node";
import ActionEntity from "../entity/Action";
import ActionTypeEntity from "../entity/ActionType";
import FieldMapEntity from '../entity/FieldMap';
import OriginNameEntity from '../entity/OriginName';

@Model('flow-nd/Action')
class Action extends Controller {

    @Get()
    @DbSettings('Orm')
    @ReadOnly(false)
    @Log(true)
    async getFieldMapByAction(params: Record<string, any>, manager: EntityManager): Promise<unknown> {

        const { originName } = params;
        const fieldMapData = await __(manager.createQueryBuilder(FieldMapEntity, 'fm')
            .innerJoin(OriginNameEntity, 'on', 'on.originNameId = fm.originNameId')
            .where("on.name = :n ", {n: originName})
            .getMany());

        return fieldMapData;
    }

  @Get()
  @DbSettings('Orm')
  @ReadOnly(true)
  @Log(true)
  async getActions(params: Record<string, any>,  manager: EntityManager): Promise<unknown> {

    const { actionTypeName, actionId } = params;
  /*  const actionsData = await __(getManager().createQueryBuilder(ActionEntity, 'ae')
        .innerJoin(ActionTypeEntity, 'ate', 'ae.actionTypeId = ate.actionTypeId')
        .where(`ate.name = '${actionTypeName}' `)
        .getMany()
    );*/
    const actionsFind = await ActionEntity.find({
        relations: ['actionType'],
        where: {
            ...(actionTypeName ? {actionType: { // if in the service send actionTypeName
                name: actionTypeName
            }} : {}),
            ...(actionId ? {actionId: actionId} : {}),
        }
    });

    return { data: actionsFind}
  }

}

export default Action;
