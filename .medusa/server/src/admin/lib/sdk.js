"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdk = void 0;
const js_sdk_1 = __importDefault(require("@medusajs/js-sdk"));
const getBaseUrl = () => {
    if (typeof window !== "undefined") {
        return window.__BACKEND_URL__ || window.location.origin;
    }
    return process.env.BACKEND_URL || "http://localhost:9000";
};
exports.sdk = new js_sdk_1.default({
    baseUrl: getBaseUrl(),
    auth: {
        type: "session",
    },
});
