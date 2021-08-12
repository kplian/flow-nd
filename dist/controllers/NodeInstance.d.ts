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
import { EntityManager } from 'typeorm';
import { Controller } from '@pxp-nd/core';
declare class NodeInstance extends Controller {
    RecursiveInstance(params: Record<string, any>): Promise<unknown>;
    ProcessDelay(params: Record<string, any>, manager: EntityManager): Promise<unknown>;
}
export default NodeInstance;
