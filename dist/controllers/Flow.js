"use strict";
/**
 * Effex 2021
 *
 * MIT
 *
 * Flow Controller
 *
 * @summary Flow Controller
 * @author Jaime Figueroa
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
const core_1 = require("@pxp-nd/core");
const Node_1 = __importDefault(require("../entity/Node"));
const NodeConnection_1 = __importDefault(require("../entity/NodeConnection"));
let Flow = class Flow extends core_1.Controller {
    async get(params) {
        const nodes = await Node_1.default.find({ flowId: params.flowId });
        const restNodes = [];
        for (let node of nodes) {
            const connections = await NodeConnection_1.default.find({ nodeIdMaster: node.nodeId });
            restNodes.push({ node, connections: connections.map(c => c.nodeIdChild) });
        }
        return restNodes;
    }
};
__decorate([
    core_1.Get(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(true),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Flow.prototype, "get", null);
Flow = __decorate([
    core_1.Model('flow-nd/Flow')
], Flow);
exports.default = Flow;
