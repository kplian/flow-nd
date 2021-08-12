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
const NodeInstance_1 = __importDefault(require("./NodeInstance"));
const Flow_1 = __importDefault(require("./Flow"));
let FlowInstance = class FlowInstance extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'flow_instance_id' }),
    __metadata("design:type", Number)
], FlowInstance.prototype, "flowInstanceId", void 0);
__decorate([
    typeorm_1.Column({ name: 'flow_id', type: 'numeric', nullable: false }),
    __metadata("design:type", Number)
], FlowInstance.prototype, "flowId", void 0);
__decorate([
    typeorm_1.Column({ name: 'data_id', type: 'numeric', nullable: false }),
    __metadata("design:type", Number)
], FlowInstance.prototype, "dataId", void 0);
__decorate([
    typeorm_1.Column({ name: 'action_id', type: 'numeric', nullable: false }),
    __metadata("design:type", Number)
], FlowInstance.prototype, "actionId", void 0);
__decorate([
    typeorm_1.Column({ name: 'origin_name', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FlowInstance.prototype, "originName", void 0);
__decorate([
    typeorm_1.Column({ name: 'status', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FlowInstance.prototype, "status", void 0);
__decorate([
    typeorm_1.Column({ name: 'origin_key', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FlowInstance.prototype, "originKey", void 0);
__decorate([
    typeorm_1.Column({ name: 'process_number', type: 'varchar', nullable: false, length: 50 }),
    __metadata("design:type", String)
], FlowInstance.prototype, "processNumber", void 0);
__decorate([
    typeorm_1.Column({ name: 'result_from_origen', type: 'text', nullable: false }),
    __metadata("design:type", String)
], FlowInstance.prototype, "resultFromOrigen", void 0);
__decorate([
    typeorm_1.OneToMany(() => NodeInstance_1.default, (nodeInstance) => nodeInstance.flowInstance, { eager: true }),
    __metadata("design:type", Array)
], FlowInstance.prototype, "nodeInstances", void 0);
__decorate([
    typeorm_1.ManyToOne(() => Flow_1.default, flow => flow.instances),
    typeorm_1.JoinColumn({ name: 'flow_id' }),
    __metadata("design:type", Flow_1.default)
], FlowInstance.prototype, "flow", void 0);
FlowInstance = __decorate([
    typeorm_1.Entity({ name: 'twf_flow_instance' })
], FlowInstance);
exports.default = FlowInstance;
