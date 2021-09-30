import FlowInstance from './FlowInstance';
import Node from './Node';
import { PxpEntity } from '@pxp-nd/common';
export default class NodeInstance extends PxpEntity {
    nodeInstanceId: number;
    nodeId: number;
    flowInstanceId: number;
    runTime: Date;
    schedule: Date;
    status: string;
    flowInstance: FlowInstance;
    nodes: Node;
}
