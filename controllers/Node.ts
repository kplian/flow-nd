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


@Model('flow-nd/Node')
class Node extends Controller {

  async getNodeData(node: any, dataId: any, manager: EntityManager) {
    const {action: {originName, originKey}} = node;
    const executeView = `select * from ${originName} where ${originKey} = ${dataId}`;
    const resExecuteView = await __(manager.query(executeView));
    return JSON.stringify(resExecuteView[0]);
  }

}

export default Node;
