import NodeInstance from './NodeInstance';
import Flow from './Flow';
import { PxpEntity } from '@pxp-nd/common';
export default class FlowInstance extends PxpEntity {
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
