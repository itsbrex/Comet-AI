export const MODEL_REGISTRY = {
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
