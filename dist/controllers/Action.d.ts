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
declare class Action extends Controller {
    getFieldMapByAction(params: Record<string, any>, manager: EntityManager): Promise<unknown>;
    getActions(params: Record<string, any>, manager: EntityManager): Promise<unknown>;
}
export default Action;
