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
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  getManager,
} from "typeorm";
import EventModel from "../entity/Event";
import Node from "../entity/Node";
import Action from "../entity/Action";
import Flow from "../entity/Flow";
import { __ } from "@pxp-nd/core";
import FlowInstanceModel from "../entity/FlowInstance";

@EventSubscriber()
export class Event implements EntitySubscriberInterface<EventModel> {
  listenTo() {
    return EventModel;
  }

  async afterInsert(event: InsertEvent<EventModel>) {
    console.log("entra");
    //todo investigate  replace variables into condition
    const newEvent = event.entity;
    const node = await __(
      Node.find({ where: { actionId: newEvent.actionId, isActive: 1 } })
    );

    for (const n of node) {
      //get data of view
      const {
        action: { originName, originKey },
      } = n;
      const executeView = `select * from ${originName} where ${originKey} = ${newEvent.dataId}`;
      const resExecuteView = await getManager().query(executeView);
      const flow = await __(Flow.findOne({ where: { flowId: n.flowId, isActive: 1 } }));
      if (
        flow.vendorId == resExecuteView[0].vendor_id &&
        (await this.checkConditions(
          resExecuteView[0],
          n.flowId,
          newEvent.actionId
        ))
      ) {
        //now check all conditions
        let flowInstance = new FlowInstanceModel();
        flowInstance.flowId = n.flowId;
        flowInstance.dataId = newEvent.dataId;
        flowInstance.originName = originName;
        flowInstance.originKey = originKey;
        flowInstance.actionId = newEvent.actionId;
        flowInstance.status = "pending";
        flowInstance = await event.manager.save(
          FlowInstanceModel,
          flowInstance
        );
      }
    }
  }
  async checkConditions(
    viewData: Record<string, any>,
    flowId: number,
    actionId: number
  ) {
    const action = await Action.findOne(actionId);
    const node = await Node.findOne({ where: { actionId, flowId } });

    let res = true;
    if (action.eventConfig && node.actionConfigJson) {
      const eventConfig = JSON.parse(action.eventConfig);
      const actionConfigJson = JSON.parse(node.actionConfigJson);
      if (eventConfig.filters) {
        eventConfig.filters.forEach((filter: Record<string, any>) => {
          if (
            actionConfigJson[filter.nodeField] &&
            viewData[filter.originField] != actionConfigJson[filter.nodeField]
          ) {
            res = false;
          }
        });
      }
    }
    return res;
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
