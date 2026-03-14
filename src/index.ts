export { xmlToJson } from './converter/xml-to-json/index.js';
export { jsonToXml } from './converter/json-to-xml/index.js';
export { detectVersion } from './version/detect.js';

export type {
  DdexMessage,
  ErnVersion,
  ErnMajorVersion,
} from './types/ern.js';

export type { SoundRecording } from './types/sound-recording.js';
export type { Release, TrackRelease } from './types/release.js';
export type { Deal, DealTerms } from './types/deal.js';
export type { Party, Artist, DisplayArtist } from './types/party.js';
export type { TextWithAttribute } from './types/common.js';
