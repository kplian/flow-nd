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
const lodash_1 = __importDefault(require("lodash"));
const FieldMap_1 = __importDefault(require("../entity/FieldMap"));
const OriginName_1 = __importDefault(require("../entity/OriginName"));
const axios_1 = __importDefault(require("axios"));
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
        const { nodeId } = node;
        const nodeData = await manager.findOne(Node_1.default, nodeId);
        return nodeData;
    }
    async AddActionConfigJson(params, manager) {
        let { nodeId: removed, __metadata: removed2, ...actionConfigJson } = params;
        Object.entries(params.__metadata).forEach(([nameKey, values]) => {
            actionConfigJson[nameKey] = `{{ ${values.name} }}`;
        });
        const upd = await core_1.__(manager.update(Node_1.default, params.nodeId, {
            actionConfigJson: JSON.stringify(actionConfigJson),
        }));
        return {
            actionConfigJson,
            success: true,
            nodeId: params.nodeId,
            upd
        };
    }
    async getParameterizedNode(params, manager) {
        lodash_1.default.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
        const { nodeId, flowId, substitutionsSchemaJson = {} } = params;
        const tNodeOrigin = await core_1.__(Node_1.default.findOne({
            relations: ['action'],
            where: {
                flowId: flowId,
                isInit: 'Y',
                action: {
                    originName: typeorm_1.Not(typeorm_1.IsNull())
                }
            }
        }));
        const tNodeData = core_1.__(Node_1.default.findOne(nodeId));
        const tFieldMapData = core_1.__(manager.createQueryBuilder(FieldMap_1.default, 'fm')
            .innerJoin(OriginName_1.default, 'on', 'on.originNameId = fm.originNameId')
            .where("on.name = :n ", { n: tNodeOrigin.action.originName })
            .getMany());
        //const nodeOrigin = await tNodeOrigin; todo
        const nodeData = await tNodeData;
        const fieldMapData = await tFieldMapData;
        /*const [nodeData, fieldMapData] = await Promise.all([
          tNodeData,
          tFieldMapData
        ]);*/
        const { actionConfigJson, action: { schemaJson, configJsonTemplate, actionType: { schemaJson: schemaJsonFromActionType } } } = nodeData;
        const actionConfigJsonObject = actionConfigJson ? JSON.parse(actionConfigJson) : {};
        const configJsonTemplateObject = configJsonTemplate ? JSON.parse(configJsonTemplate) : {};
        let schemaJsonFromActionTypeObject = schemaJsonFromActionType ? JSON.parse(lodash_1.default.template(schemaJsonFromActionType)(substitutionsSchemaJson)) : {};
        let schemaJsonFromActionObject = schemaJson ? JSON.parse(lodash_1.default.template(schemaJson)(substitutionsSchemaJson)) : {};
        let schemaJsonObject = { ...schemaJsonFromActionTypeObject, ...schemaJsonFromActionObject };
        const mergeValues = {
            ...configJsonTemplateObject,
            ...actionConfigJsonObject
        };
        const verifyIfValueFromFieldMap = (str) => {
            if (/^{{/.test(str) && /}}$/.test(str)) {
                return true;
            }
            return false;
        };
        const findFieldMapAndMetaData = (value) => {
            const found = fieldMapData.find((fmd) => `{{ ${fmd.name} }}` === value) || {};
            return {
                initialValue: found.alias || value,
                metadata: found
            };
        };
        const findFieldMapUniqueByType = (fieldMappingType) => {
            const filtered = fieldMapData.filter((fmd) => fmd.type === fieldMappingType);
            if (filtered && filtered.length === 1) {
                const [found] = filtered;
                return {
                    initialValue: found.alias,
                    metadata: found
                };
            }
            return undefined;
        };
        // this logic is for autocomplete for moment
        const findFieldInConfigForComponent = async (json, value) => {
            if (json.formComponent && json.formComponent.type === 'AutoComplete') {
                const url = json.formComponent.store.axios.url;
                const method = json.formComponent.store.axios.method;
                const data = json.formComponent.store.axios.data;
                const idDD = json.formComponent.store.idDD;
                const descDD = json.formComponent.store.descDD;
                const config = {
                    method: method,
                    url: url,
                    headers: {
                        'Authorization': '' + process.env.TOKEN_PXP_ND + '',
                        'Content-Type': 'application/json'
                    },
                    data: {
                        ...data,
                        [idDD]: value
                    }
                };
                // @ts-ignore
                const resControllerAxios = await core_1.__(axios_1.default(config));
                const desc = resControllerAxios.data.data[descDD];
                return desc;
            }
            else if (json.formComponentTemplate && json.configGetDescValue) { // todo we need to see how works here
                const { controller, storeId, descColumn } = json.configGetDescValue;
                const config = {
                    method: "get",
                    url: `http://localhost:${process.env.PORT}/api/${controller}`,
                    headers: {
                        'Authorization': '' + process.env.TOKEN_PXP_ND + '',
                        'Content-Type': 'application/json'
                    },
                    data: {
                        [storeId]: value
                    }
                };
                // @ts-ignore
                const resControllerAxios = await core_1.__(axios_1.default(config));
                const desc = resControllerAxios.data.data[descColumn];
                return desc;
            }
            return undefined;
        };
        for (const [nameKey, value] of Object.entries(mergeValues)) {
            if (schemaJsonObject[nameKey]) {
                const descValue = await core_1.__(findFieldInConfigForComponent(schemaJsonObject[nameKey], value));
                schemaJsonObject[nameKey] = {
                    ...schemaJsonObject[nameKey],
                    initialValue: value,
                    ...(descValue && { descValue: descValue }),
                    ...(verifyIfValueFromFieldMap(value) && { fromFieldMap: true, ...findFieldMapAndMetaData(value) }),
                };
            }
        }
        Object.entries(schemaJsonObject)
            .filter(([, value]) => value.initialValue === undefined && value.fromFieldMap === undefined && value.fieldMappingType)
            .forEach(([nameKey]) => {
            const hasUniqueByTypeInMappingData = findFieldMapUniqueByType(schemaJsonObject[nameKey].fieldMappingType);
            schemaJsonObject[nameKey] = {
                ...schemaJsonObject[nameKey],
                ...(hasUniqueByTypeInMappingData && { fromFieldMap: true, ...hasUniqueByTypeInMappingData }),
            };
        });
        return {
            actionConfigJsonObject,
            configJsonTemplateObject,
            mergeValues,
            schemaJsonObject,
            schemaJson,
            node: nodeData,
            fieldMapData,
        };
    }
    async executeActionJson(params, manager) {
        const { nodeId, originName, originKey, fromValues } = params;
        // we need to get the value from merge values with originKey
        const getParameterizedNodeData = await core_1.__(this.getParameterizedNode({ nodeId: nodeId }, manager));
        const { mergeValues } = getParameterizedNodeData;
        const findOriginValue = Object.entries(mergeValues).find(([nameValue]) => fromValues === nameValue);
        const resValueObject = Object.fromEntries([findOriginValue]);
        const originValue = resValueObject[fromValues];
        const executeViewString = `select * from ${originName} where ${originKey} = ${originValue}`;
        const resExecuteView = await typeorm_1.getManager().query(executeViewString);
        /*const executeView = `select * from ${originName} where ${originKey} = ${newEvent.dataId}`;
        const resExecuteView = await getManager().query(executeView);*/
        return {
            ...resExecuteView[0]
        };
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
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Node.prototype, "AddActionConfigJson", null);
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Node.prototype, "getParameterizedNode", null);
__decorate([
    core_1.Post(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Node.prototype, "executeActionJson", null);
Node = __decorate([
    core_1.Model('flow-nd/Node')
], Node);
exports.default = Node;
