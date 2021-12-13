"use strict";
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
const ActionType_1 = __importDefault(require("./ActionType"));
const Node_1 = __importDefault(require("./Node"));
const common_1 = require("@pxp-nd/common");
let Action = class Action extends common_1.PxpEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'action_id' }),
    __metadata("design:type", Number)
], Action.prototype, "actionId", void 0);
__decorate([
    typeorm_1.Column({ name: 'action_type_id', type: 'numeric', nullable: true }),
    __metadata("design:type", Number)
], Action.prototype, "actionTypeId", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 50 }),
    __metadata("design:type", String)
], Action.prototype, "code", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], Action.prototype, "name", void 0);
__decorate([
    typeorm_1.Column({ type: 'text' }),
    __metadata("design:type", String)
], Action.prototype, "description", void 0);
__decorate([
    typeorm_1.Column({ name: 'origin_name', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Action.prototype, "originName", void 0);
__decorate([
    typeorm_1.Column({ name: 'origin_key', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Action.prototype, "originKey", void 0);
__decorate([
    typeorm_1.Column({ name: 'controller_function', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Action.prototype, "controllerFunction", void 0);
__decorate([
    typeorm_1.Column({ name: 'config_json_template', type: 'text' }),
    __metadata("design:type", String)
], Action.prototype, "configJsonTemplate", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 1, default: 'N' }),
    __metadata("design:type", String)
], Action.prototype, "hidden", void 0);
__decorate([
    typeorm_1.Column({ name: 'schema_json', type: 'text' }),
    __metadata("design:type", String)
], Action.prototype, "schemaJson", void 0);
__decorate([
    typeorm_1.ManyToOne(() => ActionType_1.default, actionType => actionType.actions, { eager: true }),
    typeorm_1.JoinColumn({ name: 'action_type_id' }),
    __metadata("design:type", ActionType_1.default)
], Action.prototype, "actionType", void 0);
__decorate([
    typeorm_1.OneToMany(() => Node_1.default, node => node.action),
    __metadata("design:type", Array)
], Action.prototype, "nodes", void 0);
__decorate([
    typeorm_1.OneToMany(() => Node_1.default, eventNode => eventNode.actionEvent),
    __metadata("design:type", Array)
], Action.prototype, "eventNodes", void 0);
Action = __decorate([
    typeorm_1.Entity({ name: 'twf_action' })
], Action);
exports.default = Action;
