import ActionType from './ActionType';
import Node from './Node';
import { PxpEntity } from '@pxp-nd/common';
export default class Action extends PxpEntity {
    actionId: number;
    actionTypeId: number;
    code: string;
    name: string;
    description: string;
    originName: string;
    originKey: string;
    controllerFunction: string;
    configJsonTemplate: string;
    eventConfig: string;
    hidden: string;
    schemaJson: string;
    actionType: ActionType;
    nodes: Node[];
    eventNodes: Node[];
}
