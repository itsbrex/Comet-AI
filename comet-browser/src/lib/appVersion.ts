import pkg from '../../package.json';

const rawVersion = (pkg?.version as string) || '0.0.0';
const channel = process.env.NEXT_PUBLIC_APP_CHANNEL?.trim() || 'Stable';
const tagline = process.env.NEXT_PUBLIC_APP_RELEASE_TAGLINE?.trim() || 'Enhancement Update';

export const APP_VERSION = rawVersion;
export const APP_VERSION_DISPLAY = `v${rawVersion}`;
export const APP_VERSION_WITH_CHANNEL = `${APP_VERSION_DISPLAY}${channel ? ` ${channel}` : ''}`;
export const APP_VERSION_CHANNEL = channel;
export const APP_RELEASE_TAGLINE = tagline;

export const APP_VERSION_LABEL = `Version ${APP_VERSION_WITH_CHANNEL}`;
