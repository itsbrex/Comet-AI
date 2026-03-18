export const MODEL_REGISTRY = {
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

const RECOMMENDED_BY_PROVIDER: Record<string, any> = {
  google: MODEL_REGISTRY.google.pro,
  'google-flash': MODEL_REGISTRY.google.flash,
};

export const getRecommendedGeminiModel = (providerId = 'google'): string => {
  return RECOMMENDED_BY_PROVIDER[providerId] ? RECOMMENDED_BY_PROVIDER[providerId].id : MODEL_REGISTRY.google.pro.id;
};

export const getGeminiModelMetadata = (providerId = 'google'): any => {
  return RECOMMENDED_BY_PROVIDER[providerId] || MODEL_REGISTRY.google.pro;
};
