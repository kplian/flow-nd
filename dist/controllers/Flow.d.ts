/**
 * Effex 2021
 *
 * MIT
 *
 * Flow Controller
 *
 * @summary Flow Controller
 * @author Jaime Figueroa
 *
 * Created at     : 2021-07-08 12:55:38
 * Last modified  :
 */
import { EntityManager } from 'typeorm';
import { Controller } from '@pxp-nd/core';
declare class Flow extends Controller {
    get(params: Record<string, any>): Promise<unknown>;
    copyNodeConnections(nodeId: number, newNodeId: number, newFlowId: number, manager: EntityManager): Promise<void>;
    copyNode(node: Record<any, any>, newFlowId: number, manager: EntityManager): Promise<{
        nodeId: any;
    }>;
    createFlowFromFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown>;
}
export default Flow;
