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
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { TransactionStartEvent } from 'typeorm/subscriber/event/TransactionStartEvent';
import { TransactionCommitEvent } from 'typeorm/subscriber/event/TransactionCommitEvent';
import { TransactionRollbackEvent } from 'typeorm/subscriber/event/TransactionRollbackEvent';
import EventModel from '../entity/Event';
import Flow from '../entity/Flow';
import Node from '../entity/Node';
import { __ } from '@pxp-nd/core';
import FlowInstanceModel from '../entity/FlowInstance';
import FlowInstance from '../entity/FlowInstance';
import NodeInstanceController from '../controllers/NodeInstance';
import NodeConnection from '../entity/NodeConnection';

@EventSubscriber()
export class Event implements EntitySubscriberInterface<EventModel> {

  listenTo() {
    return EventModel;
  }

  async afterInsert(event: InsertEvent<EventModel>) {

    //todo investigate  replace variables into condition


    const newEvent = event.entity;
    const node = await __(Node.find({ where: { actionId: newEvent.actionId } }))
    //const node = await __(event.manager.find(Node, { where: { actionId: newEvent.actionId } }))

    console.log('afterInsert', newEvent)
    console.log('node has found', node)

    for (const n of node) {

      //get data of view
      const {action: {originName, originKey}} = n;

     /* console.log('n',n)
      console.log('originName',originName)
      console.log('originKey',originKey)*/
      const executeView = `select * from ${originName} where ${originKey} = ${newEvent.dataId}`
      const resExecuteView = await __(event.manager.query(executeView))
     /* console.log('executeView',executeView)
      console.log('resExecuteView',resExecuteView)*/
      let flowInstance = new FlowInstanceModel();
      flowInstance.flowId = n.flowId;
      flowInstance.eventId = newEvent.eventId;
      flowInstance.processNumber = 'code1';
      flowInstance.resultFromOrigen = JSON.stringify(resExecuteView[0]);
      flowInstance = await event.manager.save(FlowInstanceModel, flowInstance);
      /*console.log('flowInstance',flowInstance)*/

      const CNodeInstance = new NodeInstanceController('flow-nd');
      await CNodeInstance.RecursiveInstance({ node:n, flowInstance, resultFromOrigin: resExecuteView[0] }, event.manager);


    }
  }
/*
  /!**
   * Called after entity is loaded.
   *!/
  afterLoad(entity: any) {
    console.log(`AFTER ENTITY LOADED: `, entity);
  }

  /!**
   * Called before post insertion.
   *!/
  beforeInsert(event: InsertEvent<any>) {
    console.log(`BEFORE POST INSERTED: `, event.entity);
  }

  /!**
   * Called after entity insertion.
   *!/
  afterInsert(event: InsertEvent<any>) {
    console.log(`AFTER ENTITY INSERTED: `, event.entity);
  }

  /!**
   * Called before entity update.
   *!/
  beforeUpdate(event: UpdateEvent<any>) {
    console.log(`BEFORE ENTITY UPDATED: `, event.entity);
  }

  /!**
   * Called after entity update.
   *!/
  afterUpdate(event: UpdateEvent<any>) {
    console.log(`AFTER ENTITY UPDATED: `, event.entity);
  }

  /!**
   * Called before entity removal.
   *!/
  beforeRemove(event: RemoveEvent<any>) {
    console.log(`BEFORE ENTITY WITH ID ${event.entityId} REMOVED: `, event.entity);
  }

  /!**
   * Called after entity removal.
   *!/
  afterRemove(event: RemoveEvent<any>) {
    console.log(`AFTER ENTITY WITH ID ${event.entityId} REMOVED: `, event.entity);
  }

  /!**
   * Called before transaction start.
   *!/
  beforeTransactionStart(event: TransactionStartEvent) {
    console.log(`BEFORE TRANSACTION STARTED: `, event);
  }

  /!**
   * Called after transaction start.
   *!/
  afterTransactionStart(event: TransactionStartEvent) {
    console.log(`AFTER TRANSACTION STARTED: `, event);
  }

  /!**
   * Called before transaction commit.
   *!/
  beforeTransactionCommit(event: TransactionCommitEvent) {
    console.log(`BEFORE TRANSACTION COMMITTED: `, event);
  }

  /!**
   * Called after transaction commit.
   *!/
  afterTransactionCommit(event: TransactionCommitEvent) {
    console.log(`AFTER TRANSACTION COMMITTED: `, event);
  }

  /!**
   * Called before transaction rollback.
   *!/
  beforeTransactionRollback(event: TransactionRollbackEvent) {
    console.log(`BEFORE TRANSACTION ROLLBACK: `, event);
  }

  /!**
   * Called after transaction rollback.
   *!/
  afterTransactionRollback(event: TransactionRollbackEvent) {
    console.log(`AFTER TRANSACTION ROLLBACK: `, event);
  }*/

}
