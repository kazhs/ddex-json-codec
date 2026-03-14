export { xmlToJson } from './converter/xml-to-json/index.js';
export { jsonToXml } from './converter/json-to-xml/index.js';
export { detectVersion } from './version/detect.js';

export type {
  DdexMessage,
  ErnVersion,
  ErnMajorVersion,
  MessageHeader,
  MessageParty,
} from './types/ern.js';

export type { SoundRecording } from './types/sound-recording.js';
export type { Release, TrackRelease, ResourceGroup, ReleaseResourceReference } from './types/release.js';
export type { ReleaseDeal, Deal, DealTerms, Usage } from './types/deal.js';
export type { Party, Artist, DisplayArtist, ResourceContributor, IndirectResourceContributor } from './types/party.js';
export type { TextWithAttribute, Genre, PLine, CLine, Title } from './types/common.js';
