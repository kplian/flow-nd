/**
 * Copyright(c) 2021 Qorus Inc
 * * All rights reserved
 * * ******************************************************************************
 * * NAME: Flow.ts
 * * DEVELOPER: Jaime Figueroa
 * * DESCRIPTION: Flow Controller
 * * REVISIONS:
 * * Date             Change ID     Author Description
 * * -------------- ----------- -------------- ------------------------------------
 * 08-Jul-2021                  Jaime Rivera           Created
 * 18-Jul-2023    SP28JUL23     Mercedes Zambrana      Add deleteFlow, saveFlowName, duplicateFlow
 * ******************************************************************************
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
    deleteFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown>;
    saveFlowName(params: Record<string, any>, manager: EntityManager): Promise<unknown>;
    duplicateFlow(params: Record<string, any>, manager: EntityManager): Promise<unknown>;
    getFlowRender(params: Record<string, any>): Promise<unknown>;
    sortNodesByConnections(nodes: any[], connections: any[]): any[];
}
export default Flow;
