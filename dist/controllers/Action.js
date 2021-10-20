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
const core_1 = require("@pxp-nd/core");
const Action_1 = __importDefault(require("../entity/Action"));
const FieldMap_1 = __importDefault(require("../entity/FieldMap"));
const OriginName_1 = __importDefault(require("../entity/OriginName"));
let Action = class Action extends core_1.Controller {
    async getFieldMapByAction(params, manager) {
        const { originName } = params;
        const fieldMapData = await core_1.__(manager.createQueryBuilder(FieldMap_1.default, 'fm')
            .innerJoin(OriginName_1.default, 'on', 'on.originNameId = fm.originNameId')
            .where("on.name = :n ", { n: originName })
            .getMany());
        return fieldMapData;
    }
    async getActions(params, manager) {
        const { actionTypeName, actionId } = params;
        /*  const actionsData = await __(getManager().createQueryBuilder(ActionEntity, 'ae')
              .innerJoin(ActionTypeEntity, 'ate', 'ae.actionTypeId = ate.actionTypeId')
              .where(`ate.name = '${actionTypeName}' `)
              .getMany()
          );*/
        const actionsFind = await Action_1.default.find({
            relations: ['actionType'],
            where: Object.assign(Object.assign({}, (actionTypeName ? { actionType: {
                    name: actionTypeName
                } } : {})), (actionId ? { actionId: actionId } : {}))
        });
        return { data: actionsFind };
    }
};
__decorate([
    core_1.Get(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(false),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Action.prototype, "getFieldMapByAction", null);
__decorate([
    core_1.Get(),
    core_1.DbSettings('Orm'),
    core_1.ReadOnly(true),
    core_1.Log(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeorm_1.EntityManager]),
    __metadata("design:returntype", Promise)
], Action.prototype, "getActions", null);
Action = __decorate([
    core_1.Model('flow-nd/Action')
], Action);
exports.default = Action;
