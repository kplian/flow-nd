import Node from './Node';
import { PxpEntity } from '@pxp-nd/common';
export default class NodeConnection extends PxpEntity {
    nodeConnectionId: number;
    condition: string;
    nodeIdMaster: number;
    nodeIdChild: number;
    masterNode: Node;
    childNode: Node;
}
