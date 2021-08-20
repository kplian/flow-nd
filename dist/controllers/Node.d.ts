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
import { EntityManager } from 'typeorm';
import { Controller } from '@pxp-nd/core';
declare class Node extends Controller {
    getNodeData(node: any, dataId: any, manager: EntityManager): Promise<string>;
    add(params: Record<string, any>, manager: EntityManager): Promise<unknown>;
}
export default Node;
