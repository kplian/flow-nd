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
const typeorm_1 = require("typeorm");
const core_1 = require("@pxp-nd/core");
const Node_1 = __importDefault(require("../entity/Node"));
const NodeConnection_1 = __importDefault(require("../entity/NodeConnection"));
const Flow_1 = __importDefault(require("../entity/Flow"));
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
    async copyNodeConnections(nodeId, newNodeId, newFlowId, manager) {
        const connections = await core_1.__(NodeConnection_1.default.find({ nodeIdMaster: nodeId }));
        console.log('copyNodeConnections', nodeId, connections);
        for (let connection of connections) {
            const newNodeConnection = new NodeConnection_1.default();
            const { nodeConnectionId, nodeIdMaster, nodeIdChild, createdAt, modifiedAt, ...nodeConnectionToCopy } = connection;
            // get node from nodeIdChild
            const dataNodeChild = await Node_1.default.findOne({ nodeId: connection.nodeIdChild });
            console.log('dataNodeChild', dataNodeChild);
            const { nodeId: newNodeIdChild } = await this.copyNode(dataNodeChild, newFlowId, manager);
            Object.assign(newNodeConnection, { ...nodeConnectionToCopy, nodeIdMaster: newNodeId, nodeIdChild: newNodeIdChild });
            const insertNewNodeConnection = await core_1.__(manager.save(NodeConnection_1.default, newNodeConnection));
        }
    }
    async copyNode(node, newFlowId, manager) {
        console.log('copyNode   ', node);
        console.log('copyNode   ', node.nodeId);
        // insert new node
        const newNode = new Node_1.default();
        const { nodeId, flowId, createdAt, modifiedAt, actionConfigJson, ...nodeToCopy } = node;
        Object.assign(newNode, { ...nodeToCopy, flowId: newFlowId });
        const insertNewNode = await core_1.__(manager.save(Node_1.default, newNode));
        // insert connection
        await this.copyNodeConnections(node.nodeId, insertNewNode.nodeId, newFlowId, manager);
        return { nodeId: insertNewNode.nodeId };
    }
    async createFlowFromFlow(params, manager) {
        // we need clone the flow selected
        const dataFlow = await core_1.__(Flow_1.default.findOne(params.flowId));
        const { flowId, createdAt, modifiedAt, nodes, ...flowToCopy } = dataFlow;
        const newFlow = new Flow_1.default();
        Object.assign(newFlow, flowToCopy);
        newFlow.name = params.name;
        const insertNewFlow = await core_1.__(manager.save(Flow_1.default, newFlow));
        // create the nodes
        // get the first node "the trigger node"
        const dataNode = await Node_1.default.findOne({ where: { flowId: params.flowId }, order: { nodeId: "ASC" } });
        dataNode && await this.copyNode(dataNode, insertNewFlow.flowId, manager);
        return { flowId: insertNewFlow.flowId };
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
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Flow.prototype, "createFlowFromFlow", null);
Flow = __decorate([
    core_1.Model('flow-nd/Flow')
], Flow);
exports.default = Flow;
