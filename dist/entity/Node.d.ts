import { BaseEntity } from 'typeorm';
import Action from './Action';
import NodeConnection from './NodeConnection';
import NodeInstance from './NodeInstance';
import Flow from './Flow';
export default class Node extends BaseEntity {
    nodeId: number;
    flowId: number;
    actionId: number;
    isInit: string;
    statusEvent: string;
    isEnd: string;
    actionConfigJson: string;
    approvalConfig: string;
    typeDelay: string;
    delay: number;
    flow: Flow;
    action: Action;
    actionEvent: Action;
    masterConnections: NodeConnection[];
    childConnections: NodeConnection[];
    nodeInstances: NodeInstance[];
}
