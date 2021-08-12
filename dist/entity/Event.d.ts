import { BaseEntity } from 'typeorm';
import Action from './Action';
export default class Event extends BaseEntity {
    eventId: number;
    actionId: number;
    descJobName: string;
    dataId: number;
    action: Action;
}
