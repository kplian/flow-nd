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
const OriginName_1 = __importDefault(require("./OriginName"));
let FieldMap = class FieldMap extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'field_map_id' }),
    __metadata("design:type", Number)
], FieldMap.prototype, "fieldMapId", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], FieldMap.prototype, "name", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], FieldMap.prototype, "alias", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], FieldMap.prototype, "type", void 0);
__decorate([
    typeorm_1.Column({ name: 'origin_name_id', type: 'integer', nullable: false }),
    __metadata("design:type", Number)
], FieldMap.prototype, "originNameId", void 0);
__decorate([
    typeorm_1.Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], FieldMap.prototype, "description", void 0);
__decorate([
    typeorm_1.ManyToOne(() => OriginName_1.default, originName => originName.fields),
    typeorm_1.JoinColumn({ name: 'origin_name_id' }),
    __metadata("design:type", OriginName_1.default)
], FieldMap.prototype, "originName", void 0);
FieldMap = __decorate([
    typeorm_1.Entity({ name: 'twf_field_map' })
], FieldMap);
exports.default = FieldMap;
