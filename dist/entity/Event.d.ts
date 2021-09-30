import Action from './Action';
import { PxpEntity } from '@pxp-nd/common';
export default class Event extends PxpEntity {
    eventId: number;
    actionId: number;
    descJobName: string;
    dataId: number;
    action: Action;
}
