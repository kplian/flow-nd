import FlowInstance from './FlowInstance';
import Node from './Node';
import { PxpEntity } from '@pxp-nd/common';
export default class Flow extends PxpEntity {
    flowId: number;
    vendorId: number;
    code: number;
    name: string;
    description: string;
    enabled: string;
    type: string;
    instances: FlowInstance[];
    nodes: Node[];
}
