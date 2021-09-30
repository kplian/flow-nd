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
const common_1 = require("@pxp-nd/common");
let Event = class Event extends common_1.PxpEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'event_id' }),
    __metadata("design:type", Number)
], Event.prototype, "eventId", void 0);
__decorate([
    typeorm_1.Column({ name: 'action_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Event.prototype, "actionId", void 0);
__decorate([
    typeorm_1.Column({ name: 'desc_job_name', type: 'varchar', nullable: false, length: 200 }),
    __metadata("design:type", String)
], Event.prototype, "descJobName", void 0);
__decorate([
    typeorm_1.Column({ name: 'data_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Event.prototype, "dataId", void 0);
__decorate([
    typeorm_1.ManyToOne(() => Action_1.default, action => action.nodes),
    typeorm_1.JoinColumn({ name: 'action_id' }),
    __metadata("design:type", Action_1.default)
], Event.prototype, "action", void 0);
Event = __decorate([
    typeorm_1.Entity({ name: 'twf_event' })
], Event);
exports.default = Event;
