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
const core_1 = require("@pxp-nd/core");
const FlowInstance_1 = __importDefault(require("../entity/FlowInstance"));
const common_1 = require("@pxp-nd/common");
const NodeInstance_1 = __importDefault(require("./NodeInstance"));
const NodeInstance_2 = __importDefault(require("../entity/NodeInstance"));
const Node_1 = __importDefault(require("../entity/Node"));
class FlowInstance extends core_1.Controller {
    async processPending(params, manager) {
        const flag = await common_1.GlobalData.findOne({ data: 'wf_processing_pending_flows_flag' });
        if (flag) {
            if (flag.value == 'true') {
                throw new core_1.PxpError(400, 'Already processing pending flows');
            }
            flag.value = 'true';
            let flowInstanceIdProcessing = -1;
            await typeorm_1.getManager().save(flag);
            try {
                const maxFlows = await common_1.GlobalData.findOne({ data: 'wf_max_concurrent_flows_process' });
                const flowInstances = await FlowInstance_1.default.find({ take: (maxFlows && maxFlows.value), where: [{ status: 'pending' }], order: { flowInstanceId: "ASC" } });
                for (const flowInstance of flowInstances) {
                    flowInstanceIdProcessing = flowInstance.flowInstanceId;
                    const node = await Node_1.default.findOne({ where: { actionId: flowInstance.actionId, flowId: flowInstance.flowId } });
                    const CNodeInstance = new NodeInstance_1.default('flow-nd', NodeInstance_2.default);
                    await CNodeInstance.RecursiveInstance({ node, flowInstance });
                    flowInstance.status = 'processed';
                    await manager.save(flowInstance);
                }
            }
            catch (error) {
                flag.value = 'false';
                await typeorm_1.getManager().save(flag);
                throw new core_1.PxpError(400, 'Error processing flow: ' + flowInstanceIdProcessing);
            }
            flag.value = 'false';
            await typeorm_1.getManager().save(flag);
        }
        return { success: true };
    }
}
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], FlowInstance.prototype, "processPending", null);
exports.default = FlowInstance;
