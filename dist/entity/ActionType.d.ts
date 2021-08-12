import { BaseEntity } from 'typeorm';
import Action from './Action';
export default class ActionType extends BaseEntity {
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
