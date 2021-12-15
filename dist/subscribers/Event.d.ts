/**
 * Kplian 2021
 *
 * MIT
 *
 * Member Controller
 *
 * @summary Event Subscriber
 * @author Favio Figueroa
 *         Jaime Rivera
 *
 * Created at     : 2021-07-08 12:55:38
 * Last modified  :
 */
import { EntitySubscriberInterface, InsertEvent } from 'typeorm';
import EventModel from '../entity/Event';
export declare class Event implements EntitySubscriberInterface<EventModel> {
    listenTo(): typeof EventModel;
    afterInsert(event: InsertEvent<EventModel>): Promise<void>;
    checkConditions(viewData: Record<string, any>, flowId: number, actionId: number): Promise<boolean>;
}
