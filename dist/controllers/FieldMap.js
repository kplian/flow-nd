"use strict";
/**
 * Effex 2021
 *
 * MIT
 *
 * Member Controller
 *
 * @summary Member Controller
 * @author Favio Figueroa
 *
 * Created at     : 2021-07-08 12:55:38
 * Last modified  :
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@pxp-nd/core");
let FieldMap = class FieldMap extends core_1.Controller {
};
FieldMap = __decorate([
    core_1.Model('flow-nd/FieldMap')
], FieldMap);
exports.default = FieldMap;
