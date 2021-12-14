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
let NodeInstance = class NodeInstance extends common_1.PxpEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'node_instance_id' }),
    __metadata("design:type", Number)
], NodeInstance.prototype, "nodeInstanceId", void 0);
__decorate([
    typeorm_1.Column({ name: 'node_id', type: 'numeric', nullable: true }),
    __metadata("design:type", Number)
], NodeInstance.prototype, "nodeId", void 0);
__decorate([
    typeorm_1.Column({ name: 'flow_instance_id', type: 'numeric', nullable: true }),
    __metadata("design:type", Number)
], NodeInstance.prototype, "flowInstanceId", void 0);
__decorate([
    typeorm_1.Column({ name: 'run_time', type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], NodeInstance.prototype, "runTime", void 0);
__decorate([
    typeorm_1.Column({ name: 'schedule', type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], NodeInstance.prototype, "schedule", void 0);
__decorate([
    typeorm_1.Column({ name: 'status', type: 'varchar', nullable: false, length: 50 }),
    __metadata("design:type", String)
], NodeInstance.prototype, "status", void 0);
__decorate([
    typeorm_1.ManyToOne(() => FlowInstance_1.default, flowInstance => flowInstance.nodeInstances),
    typeorm_1.JoinColumn({ name: 'flow_instance_id' }),
    __metadata("design:type", FlowInstance_1.default)
], NodeInstance.prototype, "flowInstance", void 0);
__decorate([
    typeorm_1.ManyToOne(() => Node_1.default, node => node.nodeInstances, { eager: true }),
    typeorm_1.JoinColumn({ name: 'node_id' }),
    __metadata("design:type", Node_1.default)
], NodeInstance.prototype, "node", void 0);
NodeInstance = __decorate([
    typeorm_1.Entity({ name: 'twf_node_instance' })
], NodeInstance);
exports.default = NodeInstance;
