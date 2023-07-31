"use strict";
/**
 * Copyright(c) 2021 Qorus Inc
 * * All rights reserved
 * * ******************************************************************************
 * * NAME: Flow.ts
 * * DEVELOPER: Jaime Figueroa
 * * DESCRIPTION: Flow Controller
 * * REVISIONS:
 * * Date             Change ID     Author Description
 * * -------------- ----------- -------------- ------------------------------------
 * 08-Jul-2021                  Jaime Rivera           Created
 * 18-Jul-2023    SP28JUL23     Mercedes Zambrana      Add deleteFlow, saveFlowName, duplicateFlow
 * ******************************************************************************
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
const Action_1 = __importDefault(require("../entity/Action"));
const NodeConnection_1 = __importDefault(require("../entity/NodeConnection"));
const Flow_1 = __importDefault(require("../entity/Flow"));
let Flow = class Flow extends core_1.Controller {
    async get(params) {
        const nodes = await Node_1.default.find({ flowId: params.flowId });
        const restNodes = [];
        for (let node of nodes) {
            const { actionConfigJson, action: { actionType: { schemaJson } } } = node;
            const actionConfigJsonObject = actionConfigJson ? JSON.parse(actionConfigJson) : {};
            const schemaJsonObject = schemaJson ? JSON.parse(schemaJson) : {};
            const valuesForShowingInNode = {};
            Object.entries(schemaJsonObject).filter(([n, sjo]) => sjo.showInNode === true).forEach(([nameKey, json]) => {
                valuesForShowingInNode[nameKey] = {
                    label: json.label,
                    value: actionConfigJsonObject[nameKey] || null
                };
            });
            const nodeRow = {
                ...node,
                valuesForShowingInNode
            };
            const connections = await NodeConnection_1.default.find({ nodeIdMaster: node.nodeId });
            restNodes.push({ node: nodeRow, connections: connections.map(c => c.nodeIdChild) });
        }
        return restNodes;
    }
    async copyNodeConnections(nodeId, newNodeId, newFlowId, manager) {
        const connections = await core_1.__(NodeConnection_1.default.find({ nodeIdMaster: nodeId }));
        for (let connection of connections) {
            const newNodeConnection = new NodeConnection_1.default();
            const { nodeConnectionId, nodeIdMaster, nodeIdChild, createdAt, modifiedAt, ...nodeConnectionToCopy } = connection;
            // get node from nodeIdChild
            const dataNodeChild = await Node_1.default.findOne({ nodeId: connection.nodeIdChild });
            const { nodeId: newNodeIdChild } = await this.copyNode(dataNodeChild, newFlowId, manager);
            Object.assign(newNodeConnection, { ...nodeConnectionToCopy, nodeIdMaster: newNodeId, nodeIdChild: newNodeIdChild });
            const insertNewNodeConnection = await core_1.__(manager.save(NodeConnection_1.default, newNodeConnection));
        }
    }
    async copyNode(node, newFlowId, manager) {
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
        newFlow.description = params.description;
        const insertNewFlow = await core_1.__(manager.save(Flow_1.default, newFlow));
        // create the nodes
        // get the first node "the trigger node"
        const dataNode = await Node_1.default.findOne({ where: { flowId: params.flowId }, order: { nodeId: "ASC" } });
        dataNode && await this.copyNode(dataNode, insertNewFlow.flowId, manager);
        return { flowId: insertNewFlow.flowId };
    }
    async deleteFlow(params, manager) {
        let dataFlow = await core_1.__(Flow_1.default.findOne(params.flowId));
        if (dataFlow) {
            dataFlow.isActive = 0;
            dataFlow.enabled = 'N';
            const updFlow = await core_1.__(manager.save(dataFlow));
            if (updFlow) {
                let flowInstance = `UPDATE twf_flow_instance SET
            is_active = 'N' WHERE flow_id = ${updFlow.flowId}`;
                await manager.query(flowInstance);
                let flowNode = `UPDATE twf_node SET
            is_active = 'N' WHERE flow_id = ${updFlow.flowId}`;
                await manager.query(flowNode);
                const nodesToInact = await manager.find(Node_1.default, { flowId: updFlow.flowId });
                const originalNodeIds = nodesToInact.map((node) => node.nodeId);
                const connectionsToInact = await manager.find(NodeConnection_1.default, {
                    where: { nodeIdChild: typeorm_1.In(originalNodeIds) } // Suponiendo que originalNodeIds contiene los IDs de los nodos originales que deseas duplicar
                });
                const originalNodeCIds = connectionsToInact.map((node) => node.nodeConnectionId);
                let flowNodeC = `UPDATE twf_node_connection SET
            is_active = 'N' WHERE node_connection_id in ( ${originalNodeCIds})`;
                await manager.query(flowNodeC);
                return { success: true };
            }
            else {
                return { success: false };
            }
        }
        else {
            return { success: false };
        }
    }
    async saveFlowName(params, manager) {
        let dataFlow = await core_1.__(Flow_1.default.findOne(params.flowId));
        if (dataFlow) {
            dataFlow.name = params.name;
            const updFlow = await core_1.__(manager.save(dataFlow));
            return { success: true };
        }
        else {
            return { success: false };
        }
    }
    async duplicateFlow(params, manager) {
        const flowData = await manager.findOne(Flow_1.default, params.flowId);
        if (flowData) {
            const flowToClone = {
                ...flowData,
                flowId: undefined,
                nodes: [],
                createdAt: undefined
            };
            const flowDataClone = await manager.save(Flow_1.default, { ...flowToClone, name: `${flowData.name} Copy` });
            const nodesToDuplicate = await manager.find(Node_1.default, { flowId: flowData === null || flowData === void 0 ? void 0 : flowData.flowId, isActive: true });
            console.log('--->', nodesToDuplicate);
            if (nodesToDuplicate) {
                const originalNodeIds = nodesToDuplicate.map((node) => node.nodeId);
                const duplicatedNodes = nodesToDuplicate.map((node) => {
                    const duplicatedNode = manager.create(Node_1.default, { ...node, nodeId: undefined });
                    duplicatedNode.flowId = flowDataClone.flowId;
                    return duplicatedNode;
                });
                const savedNodes = await manager.save(duplicatedNodes);
                const newNodeIds = savedNodes.map((node) => node.nodeId);
                const connectionsToDuplicate = await manager.find(NodeConnection_1.default, {
                    where: { nodeIdChild: typeorm_1.In(originalNodeIds) }
                });
                const duplicatedConnections = newNodeIds.map((nodeId, index) => {
                    const duplicatedConnection = manager.create(NodeConnection_1.default, {
                        nodeConnectionId: undefined,
                        nodeIdMaster: index === 0 ? null : newNodeIds[index - 1],
                        nodeIdChild: nodeId,
                    });
                    return duplicatedConnection;
                });
                await manager.save(duplicatedConnections);
            }
            return { success: true };
        }
        else {
            return { success: false, "respuesta": "No Flow" };
        }
    }
    async getFlowRender(params) {
        let actions = await typeorm_1.getManager()
            .createQueryBuilder(Action_1.default, "a")
            .select([
            "a.actionId",
            "a.code",
            "a.name",
            "a.description",
            "at.name"
        ])
            .innerJoin("a.actionType", "at")
            .where(`a.isActive = 1 and a.hidden = 'N'`)
            .getMany();
        const connections = await typeorm_1.getManager()
            .createQueryBuilder(NodeConnection_1.default, "nc")
            .select([
            "nc.nodeIdMaster",
            "nc.nodeIdChild",
        ])
            .innerJoin("nc.childNode", "cn")
            .where(`cn.flowId = :flowId`, { flowId: params.flowId })
            .getMany();
        const nodes = await typeorm_1.getManager()
            .createQueryBuilder(Node_1.default, "n")
            .select([
            "n.nodeId",
            "n.flowId",
            "a.code",
            "a.name",
            "a.description",
        ])
            .innerJoin("n.action", "a")
            .where(`n.flowId = :flowId`, { flowId: params.flowId })
            .getMany();
        let sortedNodes = this.sortNodesByConnections(nodes, connections);
        actions.forEach((item) => {
            item.actionId = `action-${item.actionId}`;
        });
        sortedNodes.forEach((item) => {
            item.nodeId = `node-${item.nodeId}`;
        });
        const actionIds = actions.map((item) => item.actionId);
        const nodeIds = sortedNodes.map((item) => item.nodeId);
        sortedNodes = sortedNodes.map(({ nodeId, ...rest }) => {
            return { id: nodeId, ...rest };
        });
        const modActions = actions.map(({ actionId, ...rest }) => {
            return { id: actionId, type: 'template', ...rest };
        });
        const tasks = [...modActions, ...sortedNodes];
        const tasksObject = tasks.reduce((acc, obj) => {
            acc[obj.id] = obj;
            return acc;
        }, {});
        let response = {
            board: {
                columns: {
                    "1-column-config-nodes": {
                        id: "1-column-config-nodes",
                        name: "Add Nodes",
                        taskIds: actionIds,
                    },
                    "2-column-nodes-configured": {
                        id: "2-column-nodes-configured",
                        name: "Test Flow",
                        taskIds: nodeIds,
                    }
                },
                tasks: tasksObject,
                ordered: [
                    "1-column-config-nodes",
                    "2-column-nodes-configured"
                ],
            }
        };
        return response;
    }
    sortNodesByConnections(nodes, connections) {
        const nodeMap = new Map();
        nodes.forEach((node) => nodeMap.set(node.nodeId, node));
        const sortedNodes = [];
        const visitedNodes = new Set();
        function dfs(nodeId) {
            visitedNodes.add(nodeId);
            const node = nodeMap.get(nodeId);
            if (node) {
                sortedNodes.push(node);
            }
            const connectedNodes = connections.filter((connection) => connection.nodeIdMaster === nodeId);
            connectedNodes.forEach((connection) => {
                if (!visitedNodes.has(connection.nodeIdChild)) {
                    dfs(connection.nodeIdChild);
                }
            });
        }
        connections.forEach((connection) => {
            if (connection.nodeIdMaster === null && !visitedNodes.has(connection.nodeIdChild)) {
                dfs(connection.nodeIdChild);
            }
        });
        return sortedNodes;
    }
    async saveFlow(params, manager) {
        let nodeRefIds = params.board.columns['2-column-nodes-configured'].taskIds;
        let nodes = params.board.tasks;
        let masterId = null;
        let id = null;
        let flowId = null;
        let taskIds = [];
        if (nodeRefIds.length === 0) {
            flowId = params.board.columns['2-column-nodes-configured'].flowId;
        }
        else {
            for (const nodeId of nodeRefIds) {
                // console.log ('node:',nodes[`${nodeId}`]);
                if (nodes[`${nodeId}`]) {
                    flowId = nodes[`${nodeId}`].flowId;
                    if (nodeId != 'new') {
                        id = parseInt(nodeId.split("-")[1]);
                        taskIds.push(id);
                        const connectionsToDel = await manager.find(NodeConnection_1.default, {
                            where: { nodeIdChild: id }
                        });
                        if (connectionsToDel) {
                            //console.log("hay para eliminar---->", connectionsToDel);
                            const originalNodeCIds = connectionsToDel.map((node) => node.nodeConnectionId);
                            //console.log("eliminando: ", originalNodeCIds);
                            let flowNodeC = await typeorm_1.getManager().query(`DELETE
                                                      from twf_node_connection
                                                      WHERE node_connection_id = ${originalNodeCIds}`);
                        }
                    }
                }
            }
        }
        //If there are some nodes in node_connections after delete all records sent, to inactive node
        let connectNoDel = await typeorm_1.getManager().query(`SELECT n.node_id
                                                    from twf_node_connection nd 
                                                    inner join twf_node n on n.node_id = nd.node_id_child
                                                    WHERE n.flow_id= ${flowId}`);
        const currentNodesIds = connectNoDel.map((record) => record.node_id);
        // Get nodes to remove
        const nodesToRemove = currentNodesIds.filter((nodeId) => !taskIds.includes(nodeId.toString()));
        // Inactive nodes
        if (nodesToRemove.length > 0) {
            const delNodeConnect = await manager.delete(NodeConnection_1.default, { nodeIdChild: nodesToRemove[0] });
            if (delNodeConnect) {
                let dNode = `UPDATE twf_node SET
            is_active = 'N' WHERE node_id = ${nodesToRemove[0]}`;
                await manager.query(dNode);
            }
        }
        if (nodeRefIds.length === 0) {
        }
        else {
            for (const nodeId of nodeRefIds) {
                if (nodes[`${nodeId}`]) {
                    if (nodeId === 'new') {
                        //get information about Action
                        const newAction = await Action_1.default.findOne({ code: nodes[`${nodeId}`].action.code });
                        const newNode = manager.create(Node_1.default, {
                            nodeId: undefined,
                            flowId: nodes[`${nodeId}`].flowId,
                            isInit: 'N',
                            actionId: newAction.actionId
                        });
                        const saveNode = await manager.save(newNode);
                        id = saveNode.nodeId;
                    }
                    else {
                        id = parseInt(nodeId.split("-")[1]);
                    }
                    //save in node and node_connection
                    const newConnection = manager.create(NodeConnection_1.default, {
                        nodeConnectionId: undefined,
                        nodeIdMaster: masterId,
                        nodeIdChild: id,
                    });
                    masterId = id;
                    const savedNodes = await manager.save(newConnection);
                    // }
                }
            }
        }
        return { success: true };
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
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Flow.prototype, "deleteFlow", null);
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Flow.prototype, "saveFlowName", null);
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Flow.prototype, "duplicateFlow", null);
__decorate([
    core_1.Get(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(true),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Flow.prototype, "getFlowRender", null);
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Flow.prototype, "saveFlow", null);
Flow = __decorate([
    core_1.Model('flow-nd/Flow')
], Flow);
exports.default = Flow;
