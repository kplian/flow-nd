import { BaseEntity } from 'typeorm';
import Node from './Node';
export default class NodeConnection extends BaseEntity {
    nodeConnectionId: number;
    condition: string;
    nodeIdMaster: number;
    nodeIdChild: number;
    masterNode: Node;
    childNode: Node;
}
