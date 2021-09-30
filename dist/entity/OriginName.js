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
const FieldMap_1 = __importDefault(require("./FieldMap"));
const common_1 = require("@pxp-nd/common");
let OriginName = class OriginName extends common_1.PxpEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn({ name: 'origin_name_id' }),
    __metadata("design:type", Number)
], OriginName.prototype, "originNameId", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 100 }),
    __metadata("design:type", String)
], OriginName.prototype, "name", void 0);
__decorate([
    typeorm_1.Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], OriginName.prototype, "description", void 0);
__decorate([
    typeorm_1.Column({ type: 'varchar', nullable: false, length: 150 }),
    __metadata("design:type", String)
], OriginName.prototype, "originKey", void 0);
__decorate([
    typeorm_1.OneToMany(() => FieldMap_1.default, (fieldMap) => fieldMap.originName),
    __metadata("design:type", Array)
], OriginName.prototype, "fields", void 0);
OriginName = __decorate([
    typeorm_1.Entity({ name: 'twf_origin_name' })
], OriginName);
exports.default = OriginName;
