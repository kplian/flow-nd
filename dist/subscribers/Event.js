"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
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
const typeorm_1 = require("typeorm");
const Event_1 = __importDefault(require("../entity/Event"));
const Node_1 = __importDefault(require("../entity/Node"));
const Action_1 = __importDefault(require("../entity/Action"));
const Flow_1 = __importDefault(require("../entity/Flow"));
const core_1 = require("@pxp-nd/core");
const FlowInstance_1 = __importDefault(require("../entity/FlowInstance"));
let Event = class Event {
    listenTo() {
        return Event_1.default;
    }
    async afterInsert(event) {
        console.log('entra');
        //todo investigate  replace variables into condition
        const newEvent = event.entity;
        const node = await core_1.__(Node_1.default.find({ where: { actionId: newEvent.actionId } }));
        for (const n of node) {
            //get data of view
            const { action: { originName, originKey } } = n;
            const executeView = `select * from ${originName} where ${originKey} = ${newEvent.dataId}`;
            const resExecuteView = await typeorm_1.getManager().query(executeView);
            const flow = await core_1.__(Flow_1.default.findOne({ where: { flowId: n.flowId } }));
            if (flow.vendorId == resExecuteView[0].vendor_id && this.checkConditions(resExecuteView[0], n.flowId, newEvent.actionId)) {
                //now check all conditions
                let flowInstance = new FlowInstance_1.default();
                flowInstance.flowId = n.flowId;
                flowInstance.dataId = newEvent.dataId;
                flowInstance.originName = originName;
                flowInstance.originKey = originKey;
                flowInstance.actionId = newEvent.actionId;
                flowInstance.status = 'pending';
                flowInstance = await event.manager.save(FlowInstance_1.default, flowInstance);
            }
        }
    }
    async checkConditions(viewData, flowId, actionId) {
        const action = await Action_1.default.findOne(actionId);
        const node = await Node_1.default.findOne({ where: { actionId, flowId } });
        const actionConfigJson = JSON.parse(node.actionConfigJson);
        let res = true;
        if (action.eventConfig) {
            const eventConfig = JSON.parse(action.eventConfig);
            if (eventConfig.filters) {
                eventConfig.filters.forEach((filter) => {
                    if (actionConfigJson[filter.nodeField] && viewData[filter.originField] != actionConfigJson[filter.nodeField]) {
                        res = false;
                    }
                });
            }
        }
        return res;
    }
};
Event = __decorate([
    typeorm_1.EventSubscriber()
], Event);
exports.Event = Event;
