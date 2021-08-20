"use strict";
/**
 * Effex 2021
 *
 * MIT
 *
 * Member Controller
 *
 * @summary Member Controller
 * @author Favio Figueroa
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
const Node_1 = __importDefault(require("../entity/Node"));
const NodeConnection_1 = __importDefault(require("../entity/NodeConnection"));
const core_1 = require("@pxp-nd/core");
let Node = class Node extends core_1.Controller {
    async getNodeData(node, dataId, manager) {
        const { action: { originName, originKey } } = node;
        const executeView = `select * from ${originName} where ${originKey} = ${dataId}`;
        const resExecuteView = await core_1.__(manager.query(executeView));
        return JSON.stringify(resExecuteView[0]);
    }
    async add(params, manager) {
        let node = new Node_1.default();
        node.isInit = params.isInit;
        node.isEnd = params.isEnd;
        node.actionId = params.actionId;
        node.flowId = params.flowId;
        node = await manager.save(node);
        if (params.parents) {
            for (let parent of params.parents) {
                const nc = await NodeConnection_1.default.find({ nodeIdMaster: parent.parentId });
                for (let connection of nc) {
                    connection.nodeIdMaster = node.nodeId;
                    await manager.save(connection);
                }
                let nodeConnection = new NodeConnection_1.default();
                nodeConnection.nodeIdChild = node.nodeId;
                nodeConnection.nodeIdMaster = parent.parentId;
                nodeConnection.condition = parent.condition;
                nodeConnection = await manager.save(nodeConnection);
            }
        }
        return node;
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
], Node.prototype, "add", null);
Node = __decorate([
    core_1.Model('flow-nd/Node')
], Node);
exports.default = Node;
