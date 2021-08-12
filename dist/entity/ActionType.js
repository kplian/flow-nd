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
const Action_1 = __importDefault(require("./Action"));
let ActionType = class ActionType extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'action_type_id' }),
    __metadata("design:type", Number)
], ActionType.prototype, "actionTypeId", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], ActionType.prototype, "name", void 0);
__decorate([
    typeorm_1.Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], ActionType.prototype, "description", void 0);
__decorate([
    typeorm_1.Column({ name: 'schema_json', type: 'text' }),
    __metadata("design:type", String)
], ActionType.prototype, "schemaJson", void 0);
__decorate([
    typeorm_1.Column({ name: 'is_start', type: 'varchar', nullable: false, length: 1, default: 'N' }),
    __metadata("design:type", String)
], ActionType.prototype, "isStart", void 0);
__decorate([
    typeorm_1.Column({ name: 'is_delay', type: 'varchar', nullable: false, length: 1, default: 'N' }),
    __metadata("design:type", String)
], ActionType.prototype, "isDelay", void 0);
__decorate([
    typeorm_1.Column({ name: 'have_condition', type: 'varchar', nullable: false, length: 1, default: 'N' }),
    __metadata("design:type", String)
], ActionType.prototype, "haveCondition", void 0);
__decorate([
    typeorm_1.Column({ name: 'hidden', type: 'varchar', nullable: false, length: 1, default: 'N' }),
    __metadata("design:type", String)
], ActionType.prototype, "hidden", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ActionType.prototype, "controller", void 0);
__decorate([
    typeorm_1.Column({ name: 'extra_schema_json', type: 'text' }),
    __metadata("design:type", String)
], ActionType.prototype, "extraSchemaJson", void 0);
__decorate([
    typeorm_1.OneToMany(() => Action_1.default, (action) => action.actionType),
    __metadata("design:type", Array)
], ActionType.prototype, "actions", void 0);
ActionType = __decorate([
    typeorm_1.Entity({ name: 'twf_action_type' })
], ActionType);
exports.default = ActionType;
