"use strict";
/**
 * Database module - exports pool for backward compatibility
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const database_1 = __importDefault(require("./config/database"));
exports.db = database_1.default;
exports.default = database_1.default;
//# sourceMappingURL=db.js.map