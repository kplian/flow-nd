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
const FlowInstance_1 = __importDefault(require("./FlowInstance"));
const Node_1 = __importDefault(require("./Node"));
const common_1 = require("@pxp-nd/common");
let Flow = class Flow extends common_1.PxpEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'flow_id' }),
    __metadata("design:type", Number)
], Flow.prototype, "flowId", void 0);
__decorate([
    typeorm_1.Column({ name: 'vendor_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Flow.prototype, "vendorId", void 0);
__decorate([
    typeorm_1.Column({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Flow.prototype, "code", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], Flow.prototype, "name", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], Flow.prototype, "enabled", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], Flow.prototype, "type", void 0);
__decorate([
    typeorm_1.OneToMany(() => FlowInstance_1.default, flowInstance => flowInstance.flow),
    __metadata("design:type", Array)
], Flow.prototype, "instances", void 0);
__decorate([
    typeorm_1.OneToMany(() => Node_1.default, node => node.flow, { eager: true }),
    __metadata("design:type", Array)
], Flow.prototype, "nodes", void 0);
Flow = __decorate([
    typeorm_1.Entity({ name: 'twf_flow' })
], Flow);
exports.default = Flow;
