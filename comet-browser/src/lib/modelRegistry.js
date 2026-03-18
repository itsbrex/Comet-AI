"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeminiModelMetadata = exports.getRecommendedGeminiModel = exports.MODEL_REGISTRY = void 0;
exports.MODEL_REGISTRY = {
    google: {
        pro: {
            id: 'gemini-3.1-pro-preview',
            friendlyName: 'Gemini 3.1 Pro',
            releaseDate: '2026-02-19',
            notes: 'Latest flagship Gemini Pro with long-context reasoning and highest fidelity.',
        },
        flash: {
            id: 'gemini-3-flash-preview',
            friendlyName: 'Gemini 3 Flash',
            releaseDate: '2025-12-01',
            notes: 'Gemini 3 Flash preview — optimized for speed, cost, and strong reasoning.',
        },
    },
};
var RECOMMENDED_BY_PROVIDER = {
    google: exports.MODEL_REGISTRY.google.pro,
    'google-flash': exports.MODEL_REGISTRY.google.flash,
};
var getRecommendedGeminiModel = function (providerId) {
    if (providerId === void 0) { providerId = 'google'; }
    return RECOMMENDED_BY_PROVIDER[providerId] ? RECOMMENDED_BY_PROVIDER[providerId].id : exports.MODEL_REGISTRY.google.pro.id;
};
exports.getRecommendedGeminiModel = getRecommendedGeminiModel;
var getGeminiModelMetadata = function (providerId) {
    if (providerId === void 0) { providerId = 'google'; }
    return RECOMMENDED_BY_PROVIDER[providerId] || exports.MODEL_REGISTRY.google.pro;
};
exports.getGeminiModelMetadata = getGeminiModelMetadata;
