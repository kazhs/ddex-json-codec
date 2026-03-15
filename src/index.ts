export { xmlToJson } from './converter/xml-to-json/index.js';
export { jsonToXml } from './converter/json-to-xml/index.js';
export { detectVersion } from './version/detect.js';

export type {
  DdexMessage,
  DdexMessage38,
  DdexMessage4,
  DdexMessageBase,
  ErnVersion,
  ErnVersion38,
  ErnVersion4,
  ErnMajorVersion,
  MessageHeader,
  MessageParty,
} from './types/ern.js';

export type {
  SoundRecording,
  SoundRecording38,
  SoundRecording4,
  SoundRecordingBase,
  SoundRecordingDetailsByTerritory,
  TechnicalSoundRecordingDetails,
} from './types/sound-recording.js';

export type {
  Image,
  Image38,
  Image4,
  ImageBase,
  ImageId,
  ImageDetailsByTerritory,
  TechnicalImageDetails,
  FileDetails,
  HashSum,
} from './types/image.js';

export type {
  Release,
  Release38,
  Release4,
  ReleaseBase,
  TrackRelease,
  ResourceGroup,
  ReleaseResourceReference,
  ReleaseId,
  ReleaseDetailsByTerritory,
} from './types/release.js';

export type { ReleaseDeal, Deal, DealTerms, Usage } from './types/deal.js';

export type {
  Party,
  PartyName,
  Artist,
  ArtistRole,
  DisplayArtist,
  ResourceContributor,
  IndirectResourceContributor,
  Contributor,
} from './types/party.js';

export type { TextWithAttribute, Genre, PLine, CLine, Title, DisplayTitle } from './types/common.js';
