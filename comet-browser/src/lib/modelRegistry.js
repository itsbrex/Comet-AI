"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeminiModelMetadata = exports.getRecommendedGeminiModel = exports.MODEL_REGISTRY = void 0;
exports.MODEL_REGISTRY = {
    google: {
        pro: {
            id: 'gemini-3.1-pro',
            friendlyName: 'Gemini 3.1 Pro',
            releaseDate: '2026-03-10',
            notes: 'Highest reasoning fidelity with the freshest code/analysis updates.',
        },
        flash: {
            id: 'gemini-3.0-flash',
            friendlyName: 'Gemini 3.0 Flash',
            releaseDate: '2026-02-18',
            notes: 'Optimized for speed and low latency while keeping contextual awareness.',
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
