import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import ActionTypeModel from '../entity/ActionType';
import { TransactionStartEvent } from 'typeorm/subscriber/event/TransactionStartEvent';
import { TransactionCommitEvent } from 'typeorm/subscriber/event/TransactionCommitEvent';
import { TransactionRollbackEvent } from 'typeorm/subscriber/event/TransactionRollbackEvent';

@EventSubscriber()
export class ActionType implements EntitySubscriberInterface<ActionTypeModel> {

  listenTo() {
    return ActionTypeModel;
  }

  /*async afterInsert(event: InsertEvent<ActionTypeModel>) {
    const wordKey = event.entity;
    //event.manager.findAndCount
    //event.manager.save
    console.log('afterInsert', wordKey)

  }*/
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
