import { BaseEntity } from 'typeorm';
import ActionType from './ActionType';
import Node from './Node';
export default class Action extends BaseEntity {
    actionId: number;
    actionTypeId: number;
    code: string;
    name: string;
    description: string;
    originName: string;
    originKey: string;
    controllerFunction: string;
    configJsonTemplate: string;
    hidden: string;
    actionType: ActionType;
    nodes: Node[];
    eventNodes: Node[];
}
