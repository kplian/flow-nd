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
const NodeConnection_1 = __importDefault(require("./NodeConnection"));
const NodeInstance_1 = __importDefault(require("./NodeInstance"));
const Flow_1 = __importDefault(require("./Flow"));
let Node = class Node extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'node_id' }),
    __metadata("design:type", Number)
], Node.prototype, "nodeId", void 0);
__decorate([
    typeorm_1.Column({ name: 'flow_id', type: 'numeric', nullable: false }),
    __metadata("design:type", Number)
], Node.prototype, "flowId", void 0);
__decorate([
    typeorm_1.Column({ name: 'action_id', type: 'numeric', nullable: true }),
    __metadata("design:type", Number)
], Node.prototype, "actionId", void 0);
__decorate([
    typeorm_1.Column({ name: 'is_init', type: 'varchar', nullable: false, length: 1 }),
    __metadata("design:type", String)
], Node.prototype, "isInit", void 0);
__decorate([
    typeorm_1.Column({ name: 'status_event', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Node.prototype, "statusEvent", void 0);
__decorate([
    typeorm_1.Column({ name: 'is_end', type: 'varchar', nullable: false, length: 1 }),
    __metadata("design:type", String)
], Node.prototype, "isEnd", void 0);
__decorate([
    typeorm_1.Column({ name: 'action_config_json', type: 'text' }),
    __metadata("design:type", String)
], Node.prototype, "actionConfigJson", void 0);
__decorate([
    typeorm_1.Column({ name: 'approval_config', type: 'text' }),
    __metadata("design:type", String)
], Node.prototype, "approvalConfig", void 0);
__decorate([
    typeorm_1.Column({ name: 'type_delay', type: 'varchar' }),
    __metadata("design:type", String)
], Node.prototype, "typeDelay", void 0);
__decorate([
    typeorm_1.Column({ name: 'delay', type: 'numeric' }),
    __metadata("design:type", Number)
], Node.prototype, "delay", void 0);
__decorate([
    typeorm_1.ManyToOne(() => Flow_1.default, flow => flow.nodes),
    typeorm_1.JoinColumn({ name: 'flow_id' }),
    __metadata("design:type", Flow_1.default)
], Node.prototype, "flow", void 0);
__decorate([
    typeorm_1.ManyToOne(() => Action_1.default, action => action.nodes, { eager: true }),
    typeorm_1.JoinColumn({ name: 'action_id' }),
    __metadata("design:type", Action_1.default)
], Node.prototype, "action", void 0);
__decorate([
    typeorm_1.ManyToOne(() => Action_1.default, actionEvent => actionEvent.eventNodes),
    typeorm_1.JoinColumn({ name: 'action_id_listening_event' }),
    __metadata("design:type", Action_1.default)
], Node.prototype, "actionEvent", void 0);
__decorate([
    typeorm_1.OneToMany(() => NodeConnection_1.default, nodeConnection => nodeConnection.masterNode),
    __metadata("design:type", Array)
], Node.prototype, "masterConnections", void 0);
__decorate([
    typeorm_1.OneToMany(() => NodeConnection_1.default, nodeConnection => nodeConnection.childNode),
    __metadata("design:type", Array)
], Node.prototype, "childConnections", void 0);
__decorate([
    typeorm_1.OneToMany(() => NodeInstance_1.default, (nodeInstance) => nodeInstance.nodes),
    __metadata("design:type", Array)
], Node.prototype, "nodeInstances", void 0);
Node = __decorate([
    typeorm_1.Entity({ name: 'twf_node' })
], Node);
exports.default = Node;
