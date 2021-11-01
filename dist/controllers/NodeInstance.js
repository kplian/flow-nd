"use strict";
/**
 * Kplian 2021
 *
 * MIT
 *
 * NodeInstance Controller
 *
 * @summary Member Controller
 * @author Favio Figueroa
 *         Jaime Rivera
 *
 * Created at     : 2021-07-08 12:55:38
 * Last modified  :
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const moment_1 = __importDefault(require("moment"));
const core_1 = require("@pxp-nd/core");
const NodeConnection_1 = __importDefault(require("../entity/NodeConnection"));
const NodeInstance_1 = __importDefault(require("../entity/NodeInstance"));
const Node_1 = __importDefault(require("../entity/Node"));
const axios_1 = __importDefault(require("axios"));
const ActionType_1 = __importDefault(require("../entity/ActionType"));
const Action_1 = __importDefault(require("../entity/Action"));
const lodash_1 = __importDefault(require("lodash"));
const FlowInstance_1 = __importDefault(require("../entity/FlowInstance"));
//TODO replace this flow-nd need tobe independent library
const common_1 = require("@pxp-nd/common");
let NodeInstance = class NodeInstance extends core_1.Controller {
    async RecursiveInstance(params) {
        //https://lodash.com/docs/4.17.15#template
        lodash_1.default.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
        //todo after this we need to get the json variables and execute the view and conditions configured in the database
        const { node, flowInstance, eventNode } = params;
        const executeView = `select * from ${flowInstance.originName} where ${flowInstance.originKey} = ${flowInstance.dataId}`;
        const resExecuteView = await core_1.__(typeorm_1.getManager().query(executeView));
        const resultFromOrigin = resExecuteView[0];
        let mergeJson = {};
        const { actionConfigJson, action: { configJsonTemplate, actionType: { schemaJson } } } = node;
        if (configJsonTemplate !== '' || actionConfigJson !== '') {
            const actionConfigJsonObject = actionConfigJson && JSON.parse(lodash_1.default.template(actionConfigJson)(resultFromOrigin));
            const configJsonTemplateObject = configJsonTemplate && JSON.parse(lodash_1.default.template(configJsonTemplate)(resultFromOrigin));
            mergeJson = {
                ...(configJsonTemplateObject || {}),
                ...(actionConfigJsonObject || {}),
                __resultFromOrigin: resultFromOrigin
            };
        }
        let nodeInstance = new NodeInstance_1.default();
        nodeInstance.flowInstanceId = flowInstance.flowInstanceId;
        // @ts-ignore
        nodeInstance.nodeId = node.nodeId;
        nodeInstance.runTime = new Date();
        if (node.action.actionType.isDelay === 'Y') {
            const delay = node.delay;
            const typeDelay = node.typeDelay;
            nodeInstance.schedule = moment_1.default().add(delay, typeDelay).toDate();
            nodeInstance.status = 'WAIT';
            await typeorm_1.getManager().save(NodeInstance_1.default, nodeInstance);
        }
        else {
            if (node.action.actionType.controller) {
                const data = '';
                const config = {
                    method: 'post',
                    url: `http://localhost:${process.env.PORT}/api/${node.action.actionType.controller}`,
                    headers: {
                        'Authorization': '' + process.env.TOKEN_PXP_ND + '',
                        'Content-Type': 'application/json'
                    },
                    data: mergeJson
                };
                // @ts-ignore
                const resControllerAxios = await core_1.__(axios_1.default(config));
            }
            await typeorm_1.getManager().save(NodeInstance_1.default, nodeInstance);
            // @ts-ignore
            const nodeConnectionList = await core_1.__(NodeConnection_1.default.find({ where: { nodeIdMaster: node.nodeId } }));
            for (const nodeConnection of nodeConnectionList) {
                const condition = lodash_1.default.template(nodeConnection.condition)(resultFromOrigin);
                const evalCondition = eval(condition);
                if (evalCondition) {
                    const nodeRes = await core_1.__(Node_1.default.findOne(nodeConnection.nodeIdChild));
                    await this.RecursiveInstance({ node: nodeRes, flowInstance, resultFromOrigin });
                }
            }
        }
        return {};
    }
    async ProcessDelay(params, manager) {
        const flag = await common_1.GlobalData.findOne({ data: 'wf_processing_delay_nodes_flag' });
        if (flag) {
            if (flag.value == 'true') {
                throw new core_1.PxpError(400, 'Already processing pending flows');
            }
            flag.value = 'true';
            await typeorm_1.getManager().save(flag);
            let nodeInstanceIdProcessing = -1;
            try {
                const maxNodes = await common_1.GlobalData.findOne({ data: 'wf_max_concurrent_delay_process' });
                const nodeInstanceDelayData = await core_1.__(manager.createQueryBuilder(NodeInstance_1.default, 'ni')
                    .innerJoin(Node_1.default, 'n', 'n.nodeId = ni.nodeId')
                    .innerJoin(Action_1.default, 'a', 'a.actionId = n.actionId')
                    .innerJoin(ActionType_1.default, 'at', 'at.actionTypeId = a.actionTypeId')
                    .where("at.isDelay = 'Y' ")
                    .andWhere('ni.schedule <= :start ', { start: new Date() })
                    .andWhere("ni.status = 'WAIT' ")
                    .limit((maxNodes && maxNodes.value))
                    .getMany());
                console.log('nodeInstanceDelayData', nodeInstanceDelayData);
                for (const nodeInstance of nodeInstanceDelayData) {
                    //update status from wait to executing
                    await core_1.__(manager.update(NodeInstance_1.default, nodeInstance.nodeInstanceId, {
                        status: 'EXECUTING',
                    }));
                    const nodeConnectionList = await core_1.__(NodeConnection_1.default.find({ where: { nodeIdMaster: nodeInstance.nodeId } }));
                    const flowInstance = await core_1.__(FlowInstance_1.default.findOne(nodeInstance.flowInstanceId));
                    const resultFromOrigin = JSON.parse(flowInstance.resultFromOrigen);
                    // todo if in some transaction there is an error we need to put in some log to error and not try only some times
                    for (const nodeConnection of nodeConnectionList) { // todo create transaction for own node
                        const nodeRes = await core_1.__(Node_1.default.findOne(nodeConnection.nodeIdChild));
                        await this.RecursiveInstance({ node: nodeRes, flowInstance, resultFromOrigin });
                    }
                    //update status from wait to executed
                    await core_1.__(manager.update(NodeInstance_1.default, nodeInstance.nodeInstanceId, {
                        status: 'EXECUTED',
                    }));
                }
            }
            catch (error) {
                flag.value = 'false';
                await typeorm_1.getManager().save(flag);
                throw new core_1.PxpError(400, 'Error processing node: ' + nodeInstanceIdProcessing);
            }
            flag.value = 'false';
            await typeorm_1.getManager().save(flag);
        }
        return { success: true };
    }
};
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], NodeInstance.prototype, "ProcessDelay", null);
NodeInstance = __decorate([
    core_1.Model('flow-nd/NodeInstance')
], NodeInstance);
exports.default = NodeInstance;
