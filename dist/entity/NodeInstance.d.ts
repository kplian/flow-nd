import { BaseEntity } from 'typeorm';
import FlowInstance from './FlowInstance';
import Node from './Node';
export default class NodeInstance extends BaseEntity {
    nodeInstanceId: number;
    nodeId: number;
    flowInstanceId: number;
    runTime: Date;
    schedule: Date;
    status: string;
    flowInstance: FlowInstance;
    nodes: Node;
}
