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
const Node_1 = __importDefault(require("./Node"));
let NodeConnection = class NodeConnection extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'node_connection_id' }),
    __metadata("design:type", Number)
], NodeConnection.prototype, "nodeConnectionId", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 200 }),
    __metadata("design:type", String)
], NodeConnection.prototype, "condition", void 0);
__decorate([
    typeorm_1.Column({ name: 'node_id_master', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], NodeConnection.prototype, "nodeIdMaster", void 0);
__decorate([
    typeorm_1.Column({ name: 'node_id_child', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], NodeConnection.prototype, "nodeIdChild", void 0);
__decorate([
    typeorm_1.ManyToOne(() => Node_1.default, node => node.masterConnections),
    typeorm_1.JoinColumn({ name: 'node_id_master' }),
    __metadata("design:type", Node_1.default)
], NodeConnection.prototype, "masterNode", void 0);
__decorate([
    typeorm_1.ManyToOne(() => Node_1.default, node => node.childConnections),
    typeorm_1.JoinColumn({ name: 'node_id_child' }),
    __metadata("design:type", Node_1.default)
], NodeConnection.prototype, "childNode", void 0);
NodeConnection = __decorate([
    typeorm_1.Entity({ name: 'twf_node_connection' })
], NodeConnection);
exports.default = NodeConnection;
