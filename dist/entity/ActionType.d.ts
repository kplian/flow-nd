import Action from './Action';
import { PxpEntity } from '@pxp-nd/common';
export default class ActionType extends PxpEntity {
    actionTypeId: number;
    name: string;
    description: string;
    schemaJson: string;
    isStart: string;
    isDelay: string;
    haveCondition: string;
    hidden: string;
    controller: string;
    extraSchemaJson: string;
    actions: Action[];
}
