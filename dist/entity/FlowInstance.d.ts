import { BaseEntity } from 'typeorm';
import NodeInstance from './NodeInstance';
import Flow from './Flow';
export default class FlowInstance extends BaseEntity {
    flowInstanceId: number;
    flowId: number;
    dataId: number;
    actionId: number;
    originName: string;
    status: string;
    originKey: string;
    processNumber: string;
    resultFromOrigen: string;
    nodeInstances: NodeInstance[];
    flow: Flow;
}
