import { BaseEntity } from 'typeorm';
import FlowInstance from './FlowInstance';
import Node from './Node';
export default class Flow extends BaseEntity {
    flowId: number;
    vendorId: number;
    code: number;
    name: string;
    enabled: string;
    type: string;
    instances: FlowInstance[];
    nodes: Node[];
}
